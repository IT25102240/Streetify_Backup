package com.streetify.observer;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * VerificationEventPublisher — ConcreteSubject for Verification Events
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Lahiru (IT25102208) — User Account & Verification Module
 * Role      : Concrete Subject for driver verification events
 * ─────────────────────────────────────────────────────────────────
 *
 * Maintains the list of VerificationObservers and broadcasts
 * driver document verification events to all registered observers.
 *
 * DriverVerificationService injects and calls this publisher
 * after updating a document's status — decoupling the notification
 * logic completely from the verification business logic.
 *
 * Lecture Reference (Lecture B, Slide 37):
 *   "notifyObservers iterates through the observers and calls their
 *    update() method, passing the current state."
 */
@Component
public class VerificationEventPublisher {

    // List of all registered observers
    private final List<VerificationObserver> observers = new ArrayList<>();

    // Spring auto-injects all VerificationObserver @Component beans
    private final List<VerificationObserver> autoRegistered;

    public VerificationEventPublisher(List<VerificationObserver> autoRegistered) {
        this.autoRegistered = autoRegistered;
    }

    @PostConstruct
    public void init() {
        observers.addAll(autoRegistered);
        System.out.println("[VerificationEventPublisher] Initialised with "
                + observers.size() + " observer(s): "
                + autoRegistered.stream()
                                .map(o -> o.getClass().getSimpleName())
                                .toList());
    }

    // ─── Observer management ─────────────────────────────────────────────────

    public void addObserver(VerificationObserver observer) {
        if (!observers.contains(observer)) {
            observers.add(observer);
        }
    }

    public void removeObserver(VerificationObserver observer) {
        observers.remove(observer);
    }

    /**
     * Broadcasts a verification status change to ALL registered observers.
     *
     * Called by DriverVerificationService.reviewDocument() after
     * updating the document status in the database.
     *
     * @param driverId  the driver whose status changed
     * @param newStatus the new status string (APPROVED / REJECTED / etc.)
     * @param note      reviewer's note passed through to observers
     */
    public void notifyVerificationObservers(Long driverId, String newStatus, String note) {
        System.out.println("[VerificationEventPublisher] Notifying "
                + observers.size() + " observer(s) — Driver #"
                + driverId + " → " + newStatus);

        for (VerificationObserver observer : observers) {
            observer.onVerificationStatusChanged(driverId, newStatus, note);
        }
    }
}
