package com.streetify.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter — Intercepts every HTTP request exactly once.
 *
 * Flow:
 *   1. Extract "Authorization: Bearer <token>" header
 *   2. Parse and validate the JWT using JwtUtil
 *   3. Load UserDetails from DB via AppUserDetailsService
 *   4. Set authenticated Principal in SecurityContextHolder
 *
 * CRITICAL: Uses standard Spring Security mechanism.
 * No manual JSON parsing here.
 */
@Component
@SuppressWarnings("null")
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AppUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtil jwtUtil, AppUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // ── Step 1: Extract Authorization header ──────────────────────────
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No token present — continue to next filter (Spring Security will reject if route is protected)
            filterChain.doFilter(request, response);
            return;
        }

        // ── Step 2: Extract JWT from header ───────────────────────────────
        final String jwtToken = authHeader.substring(7); // Remove "Bearer " prefix

        // ── Step 3: Extract email from token ──────────────────────────────
        String userEmail;
        try {
            userEmail = jwtUtil.extractEmail(jwtToken);
        } catch (Exception e) {
            // Malformed token — reject silently, Spring Security will handle 401
            filterChain.doFilter(request, response);
            return;
        }

        // ── Step 4: Authenticate if not already authenticated ────────────
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            if (jwtUtil.isTokenValid(jwtToken, userDetails)) {
                // Build Spring Security authentication token
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set authenticated user in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Skip JWT filter for WebSocket upgrade requests —
     * WebSocket auth is handled separately in WebSocketConfig.
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/ws");
    }
}
