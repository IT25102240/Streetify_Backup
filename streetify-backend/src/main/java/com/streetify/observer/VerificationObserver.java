package com.streetify.observer;

/**
 * VerificationObserver — Observer Interface (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Lahiru (IT25102208) — User Account & Verification Module
 * Role      : Observer Interface
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the contract that every concrete observer must implement
 * to receive driver document verification status change events.
 *
 * PROBLEM (before Observer pattern):
 *   DriverVerificationService.reviewDocument() silently updates the DB
 *   with no notification to the driver and no audit trail entry.
 *   Adding any new listener (email, SMS, admin dashboard) would require
 *   directly modifying DriverVerificationService.
 *
 * SOLUTION (Observer pattern):
 *   Any interested party implements this interface and registers
 *   with the publisher — DriverVerificationService never needs to change.
 *
 * Lecture Reference (Lecture B, Slide 36):
 *   "The Observer interface defines a contract for objects that want
 *    to be notified about changes in the subject."
 *
 * Concrete implementations (Lahiru creates):
 *   → DriverVerificationObserver   (notifies driver via WebSocket)
 *   → AuditLogVerificationObserver (writes immutable audit trail)
 */
public interface VerificationObserver {

    /**
     * Called when a driver's document verification status changes.
     *
     * @param driverId  the ID of the driver whose document was reviewed
     * @param newStatus the new verification status
     *                  e.g. "APPROVED", "REJECTED", "PENDING_VERIFICATION"
     * @param note      the reviewer's note or reason for the decision
     */
    void onVerificationStatusChanged(Long driverId, String newStatus, String note);
}
