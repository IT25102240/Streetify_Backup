package com.streetify.decorator;

/**
 * AdminResponseDecorator — ConcreteDecorator (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Concrete Decorator 3 — adds admin resolution note
 * ─────────────────────────────────────────────────────────────────
 *
 * Wraps a DisputeView and appends the staff/admin resolution note
 * and the approved refund amount to the summary — added at runtime
 * only when the ticket has been resolved.
 *
 * Usage:
 *   DisputeView view = new BasicDisputeView(ticket);
 *   view = new AdminResponseDecorator(view, "Refund approved.", 300.0);
 *   view.getSummary();
 *   // "[FARE_DISPUTE] Overcharged | Admin: Refund approved. | Approved: LKR 300.00"
 */
public class AdminResponseDecorator extends DisputeViewDecorator {

    private final String adminNote;
    private final double approvedRefundAmount;

    public AdminResponseDecorator(DisputeView wrappedView,
                                   String adminNote,
                                   double approvedRefundAmount) {
        super(wrappedView);
        this.adminNote             = adminNote != null ? adminNote : "No note provided";
        this.approvedRefundAmount  = approvedRefundAmount;
    }

    /**
     * Appends admin resolution note and approved refund to the summary.
     */
    @Override
    public String getSummary() {
        String base = wrappedView.getSummary();
        base += " | Admin: " + adminNote;
        if (approvedRefundAmount > 0) {
            base += " | Approved refund: LKR " + String.format("%.2f", approvedRefundAmount);
        }
        return base;
    }

    /**
     * Updates the status label to reflect resolution.
     */
    @Override
    public String getStatusLabel() {
        return "✅ RESOLVED — " + wrappedView.getStatusLabel();
    }
}
