package com.streetify.decorator;

/**
 * RefundNoteDecorator — ConcreteDecorator (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Concrete Decorator 2 — adds refund amount to summary
 * ─────────────────────────────────────────────────────────────────
 *
 * Wraps a DisputeView and appends the requested refund amount to
 * the summary — dynamically at runtime, without subclassing.
 *
 * Lecture Reference (Lecture A, Slide 45 — SugarDecorator):
 *   "getCost() { return decoratedCoffee.getCost() + 0.2; }"
 *   Same pattern here: getSummary() returns wrapped + refund info.
 *
 * Usage:
 *   DisputeView view = new BasicDisputeView(ticket);
 *   view = new RefundNoteDecorator(view, 500.0);
 *   view.getSummary(); // "[FARE_DISPUTE] Overcharged | Refund requested: LKR 500.00"
 */
public class RefundNoteDecorator extends DisputeViewDecorator {

    private final double requestedRefundAmount;

    public RefundNoteDecorator(DisputeView wrappedView, double requestedRefundAmount) {
        super(wrappedView);
        this.requestedRefundAmount = requestedRefundAmount;
    }

    /**
     * Appends the refund amount to the wrapped summary.
     * Delegates to wrappedView.getSummary() first, then adds extra info.
     */
    @Override
    public String getSummary() {
        return wrappedView.getSummary()
                + " | Refund requested: LKR "
                + String.format("%.2f", requestedRefundAmount);
    }
}
