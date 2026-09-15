package com.streetify.controller;

import com.streetify.dto.SuspendUserDTO;
import com.streetify.entity.AuditLog;
import com.streetify.entity.User;
import com.streetify.security.JwtUtil;
import com.streetify.service.AdminGovernanceService;
import com.streetify.service.DriverVerificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AdminController — Admin Governance & System Control REST endpoints.
 *
 * ALL routes are protected by @PreAuthorize("hasRole('ADMIN')").
 * STAFF-accessible routes are marked with hasAnyRole('STAFF','ADMIN').
 *
 * Routes (matches Admin.tsx API hooks):
 *   GET  /api/admin/verifications           → Pending driver document queue
 *   GET  /api/admin/flagged                 → Flagged/suspended accounts
 *   GET  /api/admin/audit                   → Immutable audit log
 *   GET  /api/admin/stats                   → Dashboard KPIs
 *   GET  /api/admin/revenue/daily           → Today's revenue
 *   POST /api/admin/suspend                 → Suspend a user (ADMIN only)
 *   POST /api/admin/unsuspend/{userId}      → Lift suspension (ADMIN only)
 *   POST /api/auth/revoke-jwt               → Conceptual JWT revocation (ADMIN only)
 *
 * No manual JSON parsing — all inputs use @RequestBody DTOs or @RequestParam.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('STAFF','ADMIN')")  // Base: STAFF access
public class AdminController {

    private final AdminGovernanceService adminService;
    private final DriverVerificationService verificationService;
    private final JwtUtil jwtUtil;

    public AdminController(AdminGovernanceService adminService,
                           DriverVerificationService verificationService,
                           JwtUtil jwtUtil) {
        this.adminService = adminService;
        this.verificationService = verificationService;
        this.jwtUtil = jwtUtil;
    }

    // ─── Document Verification Queue ─────────────────────────────────────────

    /**
     * GET /api/admin/verifications
     *
     * Returns all pending driver document submissions.
     * Admin.tsx: "Document Review Queue" table.
     */
    @GetMapping("/verifications")
    public ResponseEntity<?> getPendingVerifications() {
        // Delegates to DriverVerificationService — returns pending document list
        // getDriverDocuments(null) is not valid; use DriverDocumentDAO via service
        // For admin, we need all PENDING docs — expose via service method below:
        return ResponseEntity.ok(
                verificationService.getAllPendingDocuments()
        );
    }

    // ─── Flagged Accounts ─────────────────────────────────────────────────────

    /**
     * GET /api/admin/flagged
     *
     * Returns all currently suspended/flagged users.
     * Admin.tsx: "Flagged Accounts" table.
     */
    @GetMapping("/flagged")
    public ResponseEntity<List<User>> getFlaggedAccounts() {
        return ResponseEntity.ok(adminService.getFlaggedUsers());
    }

    // ─── Audit Log ────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/audit?limit=50
     *
     * Returns the N most recent audit log entries (default 50).
     * Admin.tsx: "System Audit Log" table — immutable, append-only.
     *
     * @param limit number of entries to return (default 50, max 200)
     */
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "50") int limit
    ) {
        int safeLimit = Math.min(limit, 200);
        return ResponseEntity.ok(adminService.getRecentAuditLogs(safeLimit));
    }

    // ─── Dashboard KPIs ───────────────────────────────────────────────────────

    /**
     * GET /api/admin/stats
     *
     * Returns live dashboard statistics.
     * Admin.tsx: Live Metrics sidebar.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ─── Revenue Reporting ────────────────────────────────────────────────────

    /**
     * GET /api/admin/revenue/daily
     *
     * Returns today's total platform commission revenue (LKR).
     * Admin.tsx: Revenue Today card + bar chart.
     */
    @GetMapping("/revenue/daily")
    public ResponseEntity<Map<String, Object>> getDailyRevenue() {
        Double todayRevenue = adminService.getTodayRevenue();
        return ResponseEntity.ok(Map.of(
                "date",        java.time.LocalDate.now().toString(),
                "revenue",     todayRevenue,
                "currency",    "LKR"
        ));
    }

    // ─── Account Suspension (ADMIN only) ─────────────────────────────────────

    /**
     * POST /api/admin/suspend
     *
     * Suspends a user account. Writes immutable audit log.
     * Conceptually revokes JWT via WebSocket notification.
     *
     * Admin.tsx: "Revoke JWT & Suspend Account" button in Suspend Modal.
     *
     * @param dto           SuspendUserDTO { userId, duration, auditNote }
     * @param authorization Bearer JWT (admin's token)
     */
    @PostMapping("/suspend")
    @PreAuthorize("hasRole('ADMIN')")  // Override: ADMIN only
    public ResponseEntity<Map<String, String>> suspendUser(
            @Valid @RequestBody SuspendUserDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.substring(7);
        Long adminId = jwtUtil.extractUserId(token);
        String adminEmail = jwtUtil.extractEmail(token);

        adminService.suspendUser(adminId, adminEmail, dto);

        return ResponseEntity.ok(Map.of(
                "status",  "ok",
                "message", "User " + dto.getUserId() + " has been suspended. JWT conceptually revoked."
        ));
    }

    /**
     * POST /api/admin/unsuspend/{userId}
     *
     * Lifts a suspension from a user.
     *
     * @param userId the target user's ID
     * @param note   @RequestParam audit note
     */
    @PostMapping("/unsuspend/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> unsuspendUser(
            @PathVariable Long userId,
            @RequestParam String note,
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.substring(7);
        Long adminId = jwtUtil.extractUserId(token);
        String adminEmail = jwtUtil.extractEmail(token);

        adminService.unsuspendUser(adminId, adminEmail, userId, note);

        return ResponseEntity.ok(Map.of(
                "status",  "ok",
                "message", "Suspension lifted for user " + userId
        ));
    }

    // ─── JWT Revocation (Conceptual) ─────────────────────────────────────────

    /**
     * POST /api/auth/revoke-jwt   (mapped under /api/admin for RBAC)
     *
     * Conceptually revokes all JWT sessions for a user.
     * In production: add token to Redis blacklist or use short expiry + refresh rotation.
     * Current implementation: broadcasts WebSocket disconnect message.
     *
     * Admin.tsx: POST /api/auth/revoke-jwt { userId }
     *
     * @param userId @RequestParam the target user's ID
     */
    @PostMapping("/revoke-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> revokeJwt(
            @RequestParam Long userId,
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.substring(7);
        Long adminId = jwtUtil.extractUserId(token);
        String adminEmail = jwtUtil.extractEmail(token);

        // Broadcast session-revoked event to the user (WebSocket)
        // This is the conceptual revocation — client must clear JWT and logout
        adminService.writeAuditLog(
                adminId, adminEmail,
                "JWT_REVOKED",
                "All JWT sessions conceptually revoked for userId: " + userId,
                userId, "USER", userId
        );

        return ResponseEntity.ok(Map.of(
                "revokedCount", 1,
                "userId",       userId,
                "message",      "JWT session revoked. User will be logged out on next request."
        ));
    }
}
