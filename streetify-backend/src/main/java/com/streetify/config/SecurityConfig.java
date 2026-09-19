package com.streetify.config;

import com.streetify.security.AppUserDetailsService;
import com.streetify.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * SecurityConfig — JWT + RBAC Security Configuration for Streetify
 *
 * Architecture:
 *   - Stateless JWT (no sessions/cookies)
 *   - BCrypt password hashing (strength 12)
 *   - Role-Based Access Control (RBAC):
 *       PASSENGER → booking, payment, review, history endpoints
 *       DRIVER    → driver dashboard, trip status, telemetry
 *       STAFF     → verification queue, support tickets
 *       ADMIN     → full access including suspension and audit
 *   - CORS: allows Vite dev server (localhost:5173)
 *   - WebSocket (/ws) is EXCLUDED from JWT filter (handled by STOMP interceptor)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enables @PreAuthorize on controllers
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AppUserDetailsService userDetailsService;

    @Value("${streetify.cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          AppUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    // ─── Security Filter Chain ────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (stateless JWT — no session cookies)
            .csrf(csrf -> csrf.disable())

            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Route Authorization Rules
            .authorizeHttpRequests(auth -> auth

                // ── Public Routes (no JWT required) ───────────────────────
                .requestMatchers(
                    "/api/auth/**",           // Login, Register
                    "/ws/**",                 // WebSocket handshake
                    "/swagger-ui/**",         // Swagger UI
                    "/swagger-ui.html",
                    "/api-docs/**",           // OpenAPI JSON
                    "/v3/api-docs/**"
                ).permitAll()

                // ── Passenger & Ride Routes ────────────────────────────────
                .requestMatchers("/api/rides/**").hasAnyRole("PASSENGER", "DRIVER", "ADMIN")
                .requestMatchers("/api/payments/**").hasAnyRole("PASSENGER", "ADMIN")
                .requestMatchers("/api/reviews/**").hasAnyRole("PASSENGER", "ADMIN")
                .requestMatchers("/api/disputes/**").hasAnyRole("PASSENGER", "STAFF", "ADMIN")

                // ── Driver Routes ──────────────────────────────────────────
                .requestMatchers("/api/driver/**").hasAnyRole("DRIVER", "ADMIN")
                .requestMatchers("/api/trips/**").hasAnyRole("DRIVER", "PASSENGER", "ADMIN")

                // ── Staff Routes ───────────────────────────────────────────
                .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN")

                // ── Admin Routes (strictly ADMIN only) ────────────────────
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ── All other requests require authentication ──────────────
                .anyRequest().authenticated()
            )

            // Stateless — no HttpSession
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Plug in our DaoAuthenticationProvider
            .authenticationProvider(authenticationProvider())

            // Add JWT filter BEFORE Spring's default username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ─── Authentication Provider ─────────────────────────────────────────────

    /**
     * DaoAuthenticationProvider uses our UserDetailsService + BCrypt encoder
     * to verify passwords during login.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Exposes AuthenticationManager as a bean so AuthService can call authenticate().
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    // ─── Password Encoder ────────────────────────────────────────────────────

    /**
     * BCrypt with strength 12 — OWASP recommended for production.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    // ─── CORS Configuration ──────────────────────────────────────────────────

    /**
     * Allows the Vite React frontend to call the Spring Boot backend.
     * In production, replace with your actual frontend domain.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse allowed origins from application.properties
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
