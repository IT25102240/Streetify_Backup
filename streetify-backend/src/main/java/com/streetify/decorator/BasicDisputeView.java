package com.streetify.decorator;

import com.streetify.entity.DisputeTicket;

/**
 * BasicDisputeView — ConcreteComponent (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Concrete Component — the base object being decorated
 * ─────────────────────────────────────────────────────────────────
 *
 * Wraps the real DisputeTicket entity and provides the base
 * (plain, undecorated) view of the ticket.
 *
 * This is the starting point of every Decorator chain:
 *   DisputeView view = new BasicDisputeView(ticket);
 *   // Then wrap with any decorators as needed:
 *   view = new EscalationDecorator(view);
 *   view = new RefundNoteDecorator(view, 500.0);
 *
 * Lecture Reference (Lecture A, Slide 43):
 *   "Concrete Component — the base class that provides the default
 *    behaviour."
 */
public class BasicDisputeView implements DisputeView {

    private final DisputeTicket ticket;

    public BasicDisputeView(DisputeTicket ticket) {
        this.ticket = ticket;
    }

    /**
     * Returns the base summary: the dispute's subject and type.
     * Decorators will build on top of this string.
     */
    @Override
    public String getSummary() {
        return "[" + ticket.getDisputeType() + "] " + ticket.getSubject();
    }

    /**
     * Returns the raw status label from the ticket entity.
     * Decorators may prepend icons/labels to this string.
     */
    @Override
    public String getStatusLabel() {
        return ticket.getStatus() != null ? ticket.getStatus().name() : "UNKNOWN";
    }

    /**
     * Returns the ticket's database ID — passed through unchanged
     * by all decorators in the chain.
     */
    @Override
    public Long getTicketId() {
        return ticket.getId();
    }
}
