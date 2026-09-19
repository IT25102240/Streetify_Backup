package com.streetify.config;

import com.streetify.security.JwtUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * WebSocketConfig — Configures STOMP WebSocket message broker for Streetify.
 *
 * Endpoints:
 *   /ws                    → WebSocket handshake URL (SockJS fallback supported)
 *
 * Message Broker Prefixes:
 *   /topic/...             → Public broadcast (drivers list, fleet updates)
 *   /queue/...             → Per-user/per-trip private messages
 *   /app/...               → Client-to-server messages (@MessageMapping)
 *
 * Real-Time Channels Used:
 *   /topic/drivers         → Broadcast available driver locations to passengers
 *   /topic/trips           → Broadcast new trip requests to nearby drivers
 *   /queue/trip/{tripId}   → Private telemetry updates to specific passenger
 *   /app/telemetry         → Driver sends live GPS coordinates
 *   /topic/fleet           → Admin live fleet monitor (all driver positions)
 */
@Configuration
@EnableWebSocketMessageBroker
@SuppressWarnings("null")
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    public WebSocketConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    // ─── STOMP Endpoint Registration ────────────────────────────────────────

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Allow frontend origin for CORS during WebSocket handshake
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                // SockJS fallback for browsers that don't support native WebSockets
                .withSockJS();
    }

    // ─── Message Broker Configuration ───────────────────────────────────────

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        // Client sends messages to /app/... → @MessageMapping handlers
        registry.setApplicationDestinationPrefixes("/app");

        // Simple in-memory broker for /topic (broadcast) and /queue (point-to-point)
        registry.enableSimpleBroker("/topic", "/queue");

        // For point-to-point messaging (passenger-specific queues)
        registry.setUserDestinationPrefix("/user");
    }

    // ─── JWT Authentication for WebSocket Connections ───────────────────────

    /**
     * Intercepts CONNECT frames to validate the JWT token.
     * Clients must send: STOMP CONNECT header "Authorization: Bearer <token>"
     *
     * This ensures WebSocket connections are authenticated just like HTTP requests.
     */
    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract Authorization header from STOMP CONNECT frame
                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);

                        if (jwtUtil.isTokenStructureValid(token)) {
                            String email = jwtUtil.extractEmail(token);
                            List<String> roles = jwtUtil.extractRoles(token);

                            List<SimpleGrantedAuthority> authorities = roles.stream()
                                    .map(SimpleGrantedAuthority::new)
                                    .collect(Collectors.toList());

                            UsernamePasswordAuthenticationToken principal =
                                    new UsernamePasswordAuthenticationToken(email, null, authorities);

                            accessor.setUser(principal);
                        }
                    }
                }

                return message;
            }
        });
    }
}
