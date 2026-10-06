package com.streetify.decorator;

/**
 * DisputeView — Component Interface (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Component Interface — the base type for the chain
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the common interface implemented by both the
 * ConcreteComponent (BasicDisputeView) and all Decorators.
 * This ensures every object in the decorator chain is treated
 * as a DisputeView — they are fully interchangeable.
 *
 * PROBLEM (before Decorator):
 *   If we used inheritance to add optional features to a dispute ticket,
 *   we would need many subclasses:
 *     → EscalatedDisputeTicket
 *     → RefundDisputeTicket
 *     → EscalatedRefundDisputeTicket
 *     → AdminResolvedDisputeTicket
 *     → EscalatedAdminResolvedDisputeTicket ...
 *   This is "subclass explosion" — the lecture's Decorator problem signal.
 *
 * SOLUTION (Decorator Pattern):
 *   Start with BasicDisputeView, then wrap with any combination of:
 *     new EscalationDecorator(
 *         new RefundNoteDecorator(
 *             new AdminResponseDecorator(view, note), refundAmount
 *         )
 *     )
 *   Any combination — no extra classes needed.
 *
 * Lecture Reference (Lecture A, Slide 38):
 *   "A Structural Design Pattern. Attaches new behavior to objects
 *    dynamically at runtime. Works by wrapping the original object
 *    with a decorator object."
 *
 * Concrete implementations:
 *   Component    → DisputeView (this interface)
 *   Concrete     → BasicDisputeView
 *   Decorator    → DisputeViewDecorator (abstract)
 *   ConcreteDecorators:
 *     → EscalationDecorator   (adds escalation flag)
 *     → RefundNoteDecorator   (adds refund amount summary)
 *     → AdminResponseDecorator(adds staff resolution note)
 */
public interface DisputeView {

    /**
     * @return the ticket's full summary string, potentially enhanced
     *         by decorator wrappers (e.g. "+ Refund: LKR 500")
     */
    String getSummary();

    /**
     * @return the ticket's status label, potentially enhanced
     *         by decorator wrappers (e.g. "🚨 ESCALATED — OPEN")
     */
    String getStatusLabel();

    /**
     * @return the unique ID of the underlying dispute ticket
     */
    Long getTicketId();
}
