package com.streetify.decorator;

/**
 * DisputeViewDecorator — Abstract Decorator (GoF Decorator Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Decorator (Structural)
 * Member    : Mithun (IT25102193) — Review & Dispute Form
 * Role      : Abstract Decorator — base class for all concrete decorators
 * ─────────────────────────────────────────────────────────────────
 *
 * Holds a reference to the wrapped DisputeView object ("comp" in the
 * lecture diagram). Delegates all interface methods to the wrapped
 * object by default — concrete decorators only override what they change.
 *
 * This follows the exact structure from the lecture:
 *   Decorator implements Component AND holds a reference to a Component.
 *   It calls comp.Operation() — delegating to the wrapped object.
 *
 * Lecture Reference (Lecture A, Slide 44):
 *   "Abstract Decorator implements Coffee (the Component interface)
 *    and holds a reference to a Coffee (composition).
 *    getDescription() delegates to decoratedCoffee.getDescription()."
 *
 * The composition reference here is 'wrappedView' (equivalent to
 * 'decoratedCoffee' in the lecture's coffee example).
 */
public abstract class DisputeViewDecorator implements DisputeView {

    // The wrapped component — can be BasicDisputeView or another Decorator
    protected final DisputeView wrappedView;

    protected DisputeViewDecorator(DisputeView wrappedView) {
        this.wrappedView = wrappedView;
    }

    // Default: delegate to the wrapped view (subclasses override to enhance)

    @Override
    public String getSummary() {
        return wrappedView.getSummary();
    }

    @Override
    public String getStatusLabel() {
        return wrappedView.getStatusLabel();
    }

    @Override
    public Long getTicketId() {
        return wrappedView.getTicketId(); // always pass through unchanged
    }
}
