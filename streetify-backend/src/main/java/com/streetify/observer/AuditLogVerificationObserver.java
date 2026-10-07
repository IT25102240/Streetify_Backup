package com.streetify.observer;

import com.streetify.dao.AuditLogDAO;
import com.streetify.entity.AuditLog;
import org.springframework.stereotype.Component;

/**
 * AuditLogVerificationObserver — ConcreteObserver (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Lahiru (IT25102208) — User Account & Verification Module
 * Role      : Concrete Observer 2 — Audit trail writer
 * ─────────────────────────────────────────────────────────────────
 *
 * When a driver's verification status changes, this observer
 * automatically writes an immutable audit log entry recording
 * what happened, for admin traceability and compliance.
 *
 * Demonstrates one of the key advantages of the Observer pattern
 * (Lecture B, Slide 43):
 *   "This design pattern allows information or data transfer to
 *    multiple objects without any change in the observer or subject
 *    classes." (loose coupling)
 *
 * DriverVerificationService does NOT know this class exists.
 * It only calls VerificationEventPublisher.notifyVerificationObservers()
 * and this observer fires automatically alongside DriverVerificationObserver.
 */
@Component
public class AuditLogVerificationObserver implements VerificationObserver {

    private final AuditLogDAO auditLogDAO;

    public AuditLogVerificationObserver(AuditLogDAO auditLogDAO) {
        this.auditLogDAO = auditLogDAO;
    }

    /**
     * Reacts to a verification status change by writing an immutable
     * audit log entry to the database.
     *
     * Called automatically by VerificationEventPublisher alongside
     * DriverVerificationObserver — both fire from the same event.
     *
     * @param driverId  the driver whose document was reviewed
     * @param newStatus the resulting verification status
     * @param note      the reviewer's note / reason
     */
    @Override
    @SuppressWarnings("null")
    public void onVerificationStatusChanged(Long driverId, String newStatus, String note) {
        // Determine the action type string for the audit record
        String actionType = switch (newStatus.toUpperCase()) {
            case "APPROVED"              -> "DRIVER_VERIFICATION_APPROVED";
            case "REJECTED"              -> "DRIVER_VERIFICATION_REJECTED";
            case "PENDING_VERIFICATION"  -> "DRIVER_VERIFICATION_PENDING";
            case "SUSPENDED"             -> "DRIVER_ACCOUNT_SUSPENDED";
            default                      -> "DRIVER_VERIFICATION_" + newStatus.toUpperCase();
        };

        // Build the immutable audit log entry
        AuditLog log = AuditLog.builder()
                .performedByStaffId(0L)                   // 0L = system-generated entry
                .performedByEmail("system@streetify.com")
                .actionType(actionType)
                .description("Driver #" + driverId + " verification status changed to "
                        + newStatus + ". Note: " + (note != null ? note : "N/A"))
                .targetUserId(driverId)
                .targetEntityType("DRIVER")
                .targetEntityId(driverId)
                .build();

        auditLogDAO.save(log);

        System.out.println("[AuditLogVerificationObserver] Audit entry written — "
                + actionType + " for Driver #" + driverId);
    }
}
