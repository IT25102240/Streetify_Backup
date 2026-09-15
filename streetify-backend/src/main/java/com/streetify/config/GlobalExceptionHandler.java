package com.streetify.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler — Centralized error handling for Streetify REST API.
 *
 * Returns consistent JSON error responses for:
 *   - Validation errors (400)
 *   - Bad credentials / illegal arguments (400)
 *   - Access denied / unauthorized (403)
 *   - Not found / illegal state (404 / 409)
 *   - Unexpected server errors (500)
 *
 * All errors return: { timestamp, status, error, message }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── Validation Errors (Bean Validation @Valid) ───────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            fieldErrors.put(field, message);
        });

        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status",    400,
                "error",     "Validation Failed",
                "fields",    fieldErrors
        ));
    }

    // ─── Business Logic Errors ────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(errorBody(400, "Bad Request", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(409, "Conflict", ex.getMessage()));
    }

    // ─── Security Errors ──────────────────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(errorBody(401, "Unauthorized", "Invalid email or password."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody(403, "Forbidden", "You do not have permission to perform this action."));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurityException(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody(403, "Forbidden", ex.getMessage()));
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody(500, "Internal Server Error",
                        "An unexpected error occurred. Please contact support."));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Map<String, Object> errorBody(int status, String error, String message) {
        return Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status",    status,
                "error",     error,
                "message",   message
        );
    }
}
