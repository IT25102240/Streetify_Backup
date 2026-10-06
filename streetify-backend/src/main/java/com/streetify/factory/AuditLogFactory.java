package com.streetify.factory;

import com.streetify.entity.AuditLog;

/**
 * AuditLogFactory — Factory Class (GoF Factory Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Factory (Creational)
 * Member    : Vidura (IT25102240) — Admin Governance & System Control
 * Role      : Factory Class (THE core class of this pattern)
 * ─────────────────────────────────────────────────────────────────
 *
 * Centralises the creation of AuditLog objects for every type of
 * admin governance action. The client (AdminGovernanceService)
 * calls this factory with an AdminActionType — it never manually
 * builds AuditLog objects inline anymore.
 *
 * BEFORE (problem — object creation scattered across AdminGovernanceService):
 *
 *   // In suspendUser(): 7-parameter call with magic strings
 *   writeAuditLog(adminId, adminEmail, "ACCOUNT_SUSPENDED",
 *       "Account suspended for " + dto.getDuration() + " days...",
 *       dto.getUserId(), "USER", dto.getUserId());
 *
 *   // In unsuspendUser(): another inline 7-parameter call
 *   writeAuditLog(adminId, adminEmail, "ACCOUNT_UNSUSPENDED",
 *       "Suspension lifted. Note: " + note, userId, "USER", userId);
 *
 *   // Problems:
 *   //  1. Object creation logic duplicated in each method
 *   //  2. Magic strings ("ACCOUNT_SUSPENDED") — no compile-time safety
 *   //  3. Adding a new action type requires editing the service directly
 *
 * AFTER (Factory Pattern — centralised, type-safe, extendable):
 *
 *   AuditLog log = AuditLogFactory.create(
 *       AdminActionType.ACCOUNT_SUSPENDED,
 *       adminId, adminEmail, dto.getUserId(),
 *       "Suspended for " + dto.getDuration() + " days. Reason: " + dto.getAuditNote()
 *   );
 *   auditLogDAO.save(log);
 *
 * Lecture Reference (Lecture A, Slide 27):
 *   "Why Use Factory Pattern?
 *    - Hides object creation details.
 *    - Reduces tight coupling between client and classes.
 *    - Easy to add new product types (Open/Closed Principle).
 *    - Centralizes object creation logic.
 *    - Makes client code cleaner & more readable."
 *
 * Lecture Reference (Lecture A, Slide 32):
 *   "Create a Factory Class — the factory chooses the correct object
 *    to create. Client code uses the factory, not the concrete details."
 *
 * Advantages demonstrated:
 *   ✓ Hides AuditLog construction details from AdminGovernanceService
 *   ✓ AdminActionType enum = type-safe (no more magic strings)
 *   ✓ Adding DRIVER_BANNED action: add enum value + one case here only
 *   ✓ Promotes loose coupling — service depends on factory, not AuditLog.builder()
 */
public class AuditLogFactory {

    // Utility class — not meant to be instantiated
    private AuditLogFactory() {}

    /**
     * Creates and returns a fully configured AuditLog entity for the
     * given admin governance action.
     *
     * This is the core Factory method — it decides which variant of
     * AuditLog to create and how to configure it based on the action type.
     *
     * @param actionType  the type of admin action performed
     *                    (type-safe enum — no magic strings)
     * @param staffId     ID of the admin or staff member who performed
     *                    the action (0L if system-generated)
     * @param staffEmail  email of the admin or staff member
     * @param targetId    ID of the user or entity being acted upon
     * @param note        human-readable detail, reason, or description
     * @return a fully built AuditLog entity — ready to save via auditLogDAO
     */
    public static AuditLog create(AdminActionType actionType,
                                   Long staffId,
                                   String staffEmail,
                                   Long targetId,
                                   String note) {

        return switch (actionType) {

            // ── User Account Actions ────────────────────────────────────────

            case ACCOUNT_SUSPENDED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("ACCOUNT_SUSPENDED")
                    .description("User account suspended. Reason: "
                            + (note != null ? note : "No reason provided"))
                    .targetUserId(targetId)
                    .targetEntityType("USER")
                    .targetEntityId(targetId)
                    .build();

            case ACCOUNT_UNSUSPENDED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("ACCOUNT_UNSUSPENDED")
                    .description("User account suspension lifted. Note: "
                            + (note != null ? note : "N/A"))
                    .targetUserId(targetId)
                    .targetEntityType("USER")
                    .targetEntityId(targetId)
                    .build();

            // ── Driver Verification Actions ─────────────────────────────────

            case DRIVER_VERIFICATION_APPROVED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("DRIVER_VERIFICATION_APPROVED")
                    .description("All driver documents approved. Driver is now active. "
                            + (note != null ? note : ""))
                    .targetUserId(targetId)
                    .targetEntityType("DRIVER")
                    .targetEntityId(targetId)
                    .build();

            case DRIVER_VERIFICATION_REJECTED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("DRIVER_VERIFICATION_REJECTED")
                    .description("Driver document(s) rejected. Reason: "
                            + (note != null ? note : "No reason provided"))
                    .targetUserId(targetId)
                    .targetEntityType("DRIVER")
                    .targetEntityId(targetId)
                    .build();

            case DRIVER_DOCUMENT_REVIEWED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("DRIVER_DOCUMENT_REVIEWED")
                    .description("Driver document reviewed. Outcome: "
                            + (note != null ? note : "N/A"))
                    .targetUserId(targetId)
                    .targetEntityType("DRIVER_DOCUMENT")
                    .targetEntityId(targetId)
                    .build();

            // ── Financial & Dispute Actions ─────────────────────────────────

            case DISPUTE_RESOLVED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("DISPUTE_RESOLVED")
                    .description("Dispute ticket resolved by staff. Resolution: "
                            + (note != null ? note : "No note provided"))
                    .targetUserId(targetId)
                    .targetEntityType("DISPUTE_TICKET")
                    .targetEntityId(targetId)
                    .build();

            case DISPUTE_REFUND_APPROVED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("DISPUTE_REFUND_APPROVED")
                    .description("Refund approved and credited to passenger wallet. "
                            + (note != null ? note : ""))
                    .targetUserId(targetId)
                    .targetEntityType("DISPUTE_TICKET")
                    .targetEntityId(targetId)
                    .build();

            case REVENUE_REPORT_GENERATED -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType("REVENUE_REPORT_GENERATED")
                    .description("Revenue report generated. "
                            + (note != null ? note : ""))
                    .targetUserId(targetId)
                    .targetEntityType("SYSTEM")
                    .targetEntityId(targetId)
                    .build();

            // ── Default fallback ────────────────────────────────────────────

            default -> AuditLog.builder()
                    .performedByStaffId(staffId)
                    .performedByEmail(staffEmail)
                    .actionType(actionType.name())
                    .description(note != null ? note : "Admin action: " + actionType.name())
                    .targetUserId(targetId)
                    .targetEntityType("SYSTEM")
                    .targetEntityId(targetId)
                    .build();
        };
    }
}
