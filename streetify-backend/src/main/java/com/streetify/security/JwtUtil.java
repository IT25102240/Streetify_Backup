package com.streetify.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JwtUtil — Handles JWT token generation, validation, and claims extraction.
 *
 * Tokens include:
 *   - subject   : user email
 *   - roles     : list of ROLE_XXX strings (RBAC)
 *   - userId    : database user ID
 *   - issued at : creation timestamp
 *   - expiry    : access = 15 min, refresh = 7 days
 */
@Component
public class JwtUtil {

    @Value("${streetify.jwt.secret}")
    private String jwtSecret;

    @Value("${streetify.jwt.access-token-expiry}")
    private long accessTokenExpiry;

    @Value("${streetify.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    // ─── Key Generation ──────────────────────────────────────────────────────

    /**
     * Builds an HMAC-SHA256 signing key from the Base64-encoded secret.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ─── Token Generation ────────────────────────────────────────────────────

    /**
     * Generates a short-lived access JWT (15 minutes).
     *
     * @param userDetails Spring Security user details
     * @param userId      Database PK of the user
     * @return signed JWT string
     */
    public String generateAccessToken(UserDetails userDetails, Long userId) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .claim("userId", userId)
                .claim("tokenType", "ACCESS")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generates a long-lived refresh JWT (7 days).
     *
     * @param email user email (subject)
     * @return signed JWT string
     */
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("tokenType", "REFRESH")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry))
                .signWith(getSigningKey())
                .compact();
    }

    // ─── Claims Extraction ───────────────────────────────────────────────────

    /**
     * Parses and returns all claims from a token.
     *
     * @param token JWT string
     * @return Claims object
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the email (subject) from a JWT.
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extracts the user's database ID from a JWT.
     */
    public Long extractUserId(String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    /**
     * Extracts the list of role strings from a JWT.
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return (List<String>) extractAllClaims(token).get("roles");
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    /**
     * Validates a JWT against the given UserDetails.
     * Checks: subject match + not expired + valid signature.
     *
     * @param token       JWT string
     * @param userDetails Spring Security user
     * @return true if valid
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Checks if the token's expiration date has passed.
     */
    public boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    /**
     * Validates the token structure and signature without requiring UserDetails.
     * Used for WebSocket handshake authentication.
     */
    public boolean isTokenStructureValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
