package com.streetify.service;

import com.streetify.dao.AuditLogDAO;
import com.streetify.dao.DriverDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dao.UserDAO;
import com.streetify.dto.SuspendUserDTO;
import com.streetify.entity.AuditLog;
import com.streetify.entity.Driver;
import com.streetify.entity.DriverVerificationStatus;
import com.streetify.entity.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AdminGovernanceService — Admin and Staff governance operations.
 *
 * Responsibilities:
 *   1. Fetch flagged/suspended users
 *   2. Suspend user accounts (with JWT conceptual revocation + WS disconnect)
 *   3. Approve/reject driver documents via STAFF
 *   4. Manage audit log (immutable append-only)
 *   5. Revenue and fleet reporting for Admin Console
 *
 * Protected endpoints require @PreAuthorize("hasRole('ADMIN')") or STAFF.
 */
@Service
@Transactional
public class AdminGovernanceService {

    private final UserDAO userDAO;
    private final DriverDAO driverDAO;
    private final TripDAO tripDAO;
    private final AuditLogDAO auditLogDAO;
    private final SimpMessagingTemplate messagingTemplate;

    public AdminGovernanceService(UserDAO userDAO,
                                  DriverDAO driverDAO,
                                  TripDAO tripDAO,
                                  AuditLogDAO auditLogDAO,
                                  SimpMessagingTemplate messagingTemplate) {
        this.userDAO = userDAO;
        this.driverDAO = driverDAO;
        this.tripDAO = tripDAO;
        this.auditLogDAO = auditLogDAO;
        this.messagingTemplate = messagingTemplate;
    }

    // ─── Account Suspension ───────────────────────────────────────────────────

    /**
     * Suspends a user account and writes an immutable audit log entry.
     *
     * Steps:
     *   1. Load target user
     *   2. Calculate suspendedUntil (permanent or N days from now)
     *   3. Call userDAO.suspendUser() — sets suspended=true, active=false
     *   4. If driver: set verificationStatus = SUSPENDED
     *   5. Log action to AuditLog (immutable)
     *   6. Conceptually revoke JWT — broadcast disconnect to user's WebSocket topic
     *
     * @param adminId    authenticated admin's user ID
     * @param adminEmail authenticated admin's email
     * @param dto        SuspendUserDTO { userId, duration, auditNote }
     */
    public void suspendUser(Long adminId, String adminEmail, SuspendUserDTO dto) {
        User target = userDAO.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + dto.getUserId()));

        // Calculate suspension end time
        LocalDateTime suspendedUntil = null;
        if (!"permanent".equalsIgnoreCase(dto.getDuration())) {
            int days = Integer.parseInt(dto.getDuration());
            suspendedUntil = LocalDateTime.now().plusDays(days);
        }

        // Suspend account in DB
        userDAO.suspendUser(dto.getUserId(), suspendedUntil, dto.getAuditNote());

        // If driver: update verification status too
        if (target instanceof Driver) {
            driverDAO.updateVerificationStatus(dto.getUserId(), DriverVerificationStatus.SUSPENDED);
            driverDAO.updateOnlineStatus(dto.getUserId(), false); // force offline
        }

        // Write immutable audit log
        writeAuditLog(
                adminId, adminEmail,
                "ACCOUNT_SUSPENDED",
                "Account suspended for " + dto.getDuration() + " days. Reason: " + dto.getAuditNote(),
                dto.getUserId(),
                "USER",
                dto.getUserId()
        );

        // Conceptual JWT revocation:
        // Broadcast a "session-revoked" message to the user's notification channel.
        // When the client receives this, it should clear localStorage and redirect to login.
        // (Full revocation requires a token blacklist — e.g., Redis — in production)
        messagingTemplate.convertAndSendToUser(
                target.getEmail(),
                "/queue/notifications",
                Map.of("type", "SESSION_REVOKED",
                       "message", "Your account has been suspended. Reason: " + dto.getAuditNote())
        );
    }

    /**
     * Lifts a suspension from a user account.
     *
     * @param adminId    authenticated admin's ID
     * @param adminEmail authenticated admin's email
     * @param userId     the target user's ID
     * @param note       audit note for the lift
     */
    public void unsuspendUser(Long adminId, String adminEmail, Long userId, String note) {
        userDAO.unsuspendUser(userId);

        // If driver: restore to APPROVED status
        driverDAO.findById(userId).ifPresent(driver ->
                driverDAO.updateVerificationStatus(userId, DriverVerificationStatus.APPROVED));

        writeAuditLog(adminId, adminEmail, "ACCOUNT_UNSUSPENDED",
                "Suspension lifted. Note: " + note, userId, "USER", userId);
    }

    // ─── Flagged Accounts ─────────────────────────────────────────────────────

    /**
     * Returns all currently suspended users.
     * Admin Console: Flagged Accounts table (GET /api/admin/flagged)
     */
    @Transactional(readOnly = true)
    public List<User> getFlaggedUsers() {
        return userDAO.findAllSuspendedUsers();
    }

    // ─── Revenue Reporting ────────────────────────────────────────────────────

    /**
     * Returns today's total platform commission revenue (LKR).
     * Admin Console: Revenue Today metric.
     */
    @Transactional(readOnly = true)
    public Double getTodayRevenue() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return tripDAO.sumPlatformCommissionSince(startOfDay);
    }

    /**
     * Returns summary stats for the admin dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        return Map.of(
                "activeDrivers",   driverDAO.findAllOnlineApprovedDrivers().size(),
                "tripsLive",       tripDAO.countByStatus(com.streetify.entity.TripStatus.IN_PROGRESS),
                "tripsRequested",  tripDAO.countByStatus(com.streetify.entity.TripStatus.REQUESTED),
                "revenueToday",    getTodayRevenue(),
                "suspendedUsers",  userDAO.findAllSuspendedUsers().size()
        );
    }

    // ─── Audit Log ────────────────────────────────────────────────────────────

    /**
     * Returns the N most recent audit log entries.
     * Admin Console: GET /api/admin/audit?limit=50
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs(int limit) {
        return auditLogDAO.findRecentLogs(PageRequest.of(0, limit));
    }

    /**
     * Writes an immutable audit log entry.
     * Called internally by all admin actions.
     */
    public void writeAuditLog(Long staffId, String staffEmail, String actionType,
                               String description, Long targetUserId,
                               String targetEntityType, Long targetEntityId) {
        AuditLog log = AuditLog.builder()
                .performedByStaffId(staffId)
                .performedByEmail(staffEmail)
                .actionType(actionType)
                .description(description)
                .targetUserId(targetUserId)
                .targetEntityType(targetEntityType)
                .targetEntityId(targetEntityId)
                .build();

        auditLogDAO.save(log);
    }
}
