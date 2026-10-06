package com.streetify.decorator;

import com.streetify.entity.DisputeTicket;
import com.streetify.entity.DisputeStatus;

/**
 * DisputeDecoratorDemo — Client Code Demo (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Client Code — demonstrates the Decorator chain
 * ─────────────────────────────────────────────────────────────────
 *
 * This class demonstrates exactly how the Decorator Pattern is used
 * in the Streetify dispute system.
 *
 * Equivalent to the lecture's Main class (Lecture A, Slide 46):
 *   Coffee coffee = new SimpleCoffee();                    ← base
 *   coffee = new MilkDecorator(coffee);                   ← wrap 1
 *   coffee = new SugarDecorator(coffee);                  ← wrap 2
 *
 * Streetify equivalent:
 *   DisputeView view = new BasicDisputeView(ticket);      ← base
 *   view = new RefundNoteDecorator(view, 500.0);          ← wrap 1
 *   view = new EscalationDecorator(view);                 ← wrap 2
 *   view = new AdminResponseDecorator(view, note, 300.0); ← wrap 3
 *
 * KEY POINT: The base DisputeTicket class is NEVER modified.
 * Optional features are stacked dynamically at runtime.
 */
public class DisputeDecoratorDemo {

    /**
     * Builds a decorated DisputeView from a real DisputeTicket.
     *
     * Decorators are applied conditionally — only if the data exists.
     * This mirrors how the lecture describes Decorator:
     *   "Start with a base object and add add-ons dynamically."
     *
     * @param ticket      the real entity from the database
     * @param isEscalated true if this ticket needs senior admin attention
     * @return a fully decorated DisputeView ready for display or API response
     */
    public static DisputeView buildView(DisputeTicket ticket, boolean isEscalated) {

        // ── Step 1: Start with the base (ConcreteComponent) ──────────────────
        // Equivalent to: Coffee coffee = new SimpleCoffee();
        DisputeView view = new BasicDisputeView(ticket);

        System.out.println("── Base view ──────────────────────────────");
        System.out.println("Summary : " + view.getSummary());
        System.out.println("Status  : " + view.getStatusLabel());

        // ── Step 2: Add Refund Note if passenger requested a refund ───────────
        // Equivalent to: coffee = new MilkDecorator(coffee);
        if (ticket.getRequestedRefundAmount() != null
                && ticket.getRequestedRefundAmount() > 0) {
            view = new RefundNoteDecorator(view, ticket.getRequestedRefundAmount());
            System.out.println("\n── After RefundNoteDecorator ───────────────");
            System.out.println("Summary : " + view.getSummary());
        }

        // ── Step 3: Add Escalation flag if senior admin attention needed ──────
        // Equivalent to: coffee = new SugarDecorator(coffee);
        if (isEscalated) {
            view = new EscalationDecorator(view);
            System.out.println("\n── After EscalationDecorator ───────────────");
            System.out.println("Status  : " + view.getStatusLabel());
            System.out.println("Summary : " + view.getSummary());
        }

        // ── Step 4: Add Admin Response if ticket has been resolved ────────────
        if (ticket.getResolutionNote() != null
                && ticket.getStatus() == DisputeStatus.RESOLVED) {
            double approved = ticket.getApprovedRefundAmount() != null
                    ? ticket.getApprovedRefundAmount() : 0.0;
            view = new AdminResponseDecorator(view, ticket.getResolutionNote(), approved);
            System.out.println("\n── After AdminResponseDecorator ─────────────");
            System.out.println("Summary : " + view.getSummary());
            System.out.println("Status  : " + view.getStatusLabel());
        }

        System.out.println("\n══ Final Decorated View ════════════════════");
        System.out.println("Ticket ID : " + view.getTicketId());
        System.out.println("Summary   : " + view.getSummary());
        System.out.println("Status    : " + view.getStatusLabel());

        return view;
    }

    /**
     * Standalone demo — creates a mock ticket and runs the decorator chain.
     * Run this to see the Decorator Pattern output for the presentation.
     *
     * Expected output:
     * ── Base view ──────────────────────────────
     * Summary : [FARE_DISPUTE] Driver overcharged me
     * Status  : OPEN
     *
     * ── After RefundNoteDecorator ───────────────
     * Summary : [FARE_DISPUTE] Driver overcharged me | Refund requested: LKR 500.00
     *
     * ── After EscalationDecorator ───────────────
     * Status  : 🚨 ESCALATED — OPEN
     * Summary : [FARE_DISPUTE] Driver overcharged me | Refund: LKR 500.00 | ⚠ Flagged for senior admin review
     */
    public static void main(String[] args) {
        System.out.println("=== Streetify Decorator Pattern Demo ===");
        System.out.println("Pattern   : Decorator (Structural)");
        System.out.println("Member    : Mithun (IT25102193)");
        System.out.println("Module    : Review & Dispute Form");
        System.out.println("==========================================\n");

        // ── Demo 1: Open escalated ticket with refund request ─────────────────
        System.out.println("DEMO 1: Open escalated ticket with refund request");
        DisputeTicket openTicket = new DisputeTicket();
        // (In real code, this comes from disputeDAO.findById(id))

        // Use the static builder provided by the entity
        DisputeView demo1 = new BasicDisputeView(openTicket);
        demo1 = new RefundNoteDecorator(demo1, 500.0);
        demo1 = new EscalationDecorator(demo1);

        System.out.println("Summary : " + demo1.getSummary());
        System.out.println("Status  : " + demo1.getStatusLabel());

        System.out.println("\n──────────────────────────────────────────");

        // ── Demo 2: Resolved ticket with admin note ───────────────────────────
        System.out.println("\nDEMO 2: Resolved ticket with admin note");
        DisputeView demo2 = new BasicDisputeView(openTicket);
        demo2 = new RefundNoteDecorator(demo2, 300.0);
        demo2 = new AdminResponseDecorator(demo2, "Verified overcharge. Refund approved.", 300.0);

        System.out.println("Summary : " + demo2.getSummary());
        System.out.println("Status  : " + demo2.getStatusLabel());

        System.out.println("\n=== End of Decorator Pattern Demo ===");
    }
}
