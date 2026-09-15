package com.streetify.controller;

import com.streetify.dto.AuthResponseDTO;
import com.streetify.dto.DriverRegistrationDTO;
import com.streetify.dto.LoginDTO;
import com.streetify.dto.UserRegistrationDTO;
import com.streetify.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController — REST controller for authentication endpoints.
 *
 * Routes:
 *   POST /api/auth/register/passenger  → Passenger self-registration
 *   POST /api/auth/register/driver     → Driver onboarding (steps 1 & 2)
 *   POST /api/auth/login               → Login for all roles → JWT
 *   POST /api/auth/refresh             → Refresh access token
 *
 * CRITICAL: All request bodies are bound to DTOs via @RequestBody.
 * NO manual JSON parsing is performed.
 * All inputs are validated via Bean Validation (@Valid).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ─── Passenger Registration ───────────────────────────────────────────────

    /**
     * POST /api/auth/register/passenger
     *
     * Registers a new passenger account.
     * Returns 201 CREATED with JWT tokens on success.
     *
     * @param dto UserRegistrationDTO { firstName, lastName, email, password, phone }
     */
    @PostMapping("/register/passenger")
    public ResponseEntity<AuthResponseDTO> registerPassenger(
            @Valid @RequestBody UserRegistrationDTO dto
    ) {
        AuthResponseDTO response = authService.registerPassenger(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── Driver Registration ──────────────────────────────────────────────────

    /**
     * POST /api/auth/register/driver
     *
     * Registers a new driver account (steps 1 & 2 of onboarding).
     * Documents are uploaded separately via POST /api/driver/upload-documents.
     * Returns 201 CREATED with PENDING_VERIFICATION status.
     *
     * @param dto DriverRegistrationDTO { personal info + vehicle info + password }
     */
    @PostMapping("/register/driver")
    public ResponseEntity<AuthResponseDTO> registerDriver(
            @Valid @RequestBody DriverRegistrationDTO dto
    ) {
        AuthResponseDTO response = authService.registerDriver(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/login
     *
     * Authenticates any user (PASSENGER, DRIVER, STAFF, ADMIN).
     * Returns JWT access token + refresh token.
     *
     * Frontend: Login.tsx handleLogin() → POST /api/auth/login { email, password }
     *
     * @param dto LoginDTO { email, password }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginDTO dto
    ) {
        AuthResponseDTO response = authService.login(dto);
        return ResponseEntity.ok(response);
    }

    // ─── Token Refresh ────────────────────────────────────────────────────────

    /**
     * POST /api/auth/refresh
     *
     * Issues a new access token using a valid refresh token.
     * Frontend should call this when access token expires (after 15 min).
     *
     * @param refreshToken the refresh JWT passed as @RequestParam
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refreshToken(
            @RequestParam String refreshToken
    ) {
        AuthResponseDTO response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }
}
