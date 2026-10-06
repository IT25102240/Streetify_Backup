package com.streetify.decorator;

/**
 * EscalationDecorator — ConcreteDecorator (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Concrete Decorator 1 — adds escalation flag at runtime
 * ─────────────────────────────────────────────────────────────────
 *
 * Wraps a DisputeView and adds an escalation indicator to the
 * status label. Used when a dispute is flagged for senior admin
 * attention without modifying the original DisputeTicket class.
 *
 * Lecture Reference (Lecture A, Slide 45):
 *   "Concrete Decorators extend the Abstract Decorator and add
 *    behaviour before or after delegating to the wrapped object."
 *
 * Usage:
 *   DisputeView view = new BasicDisputeView(ticket);
 *   view = new EscalationDecorator(view);  // wrap at runtime
 *   System.out.println(view.getStatusLabel()); // "🚨 ESCALATED — OPEN"
 */
public class EscalationDecorator extends DisputeViewDecorator {

    public EscalationDecorator(DisputeView wrappedView) {
        super(wrappedView);
    }

    /**
     * Enhances the status label by prepending an escalation marker.
     * Calls wrappedView.getStatusLabel() first (delegation),
     * then adds the escalation prefix — same structure as the
     * lecture's MilkDecorator.getDescription().
     */
    @Override
    public String getStatusLabel() {
        return "🚨 ESCALATED — " + wrappedView.getStatusLabel();
    }

    /**
     * Adds an escalation note to the summary as well.
     */
    @Override
    public String getSummary() {
        return wrappedView.getSummary() + " | ⚠ Flagged for senior admin review";
    }
}
