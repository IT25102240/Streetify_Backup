package com.streetify.observer;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * TripEventPublisher — ConcreteSubject (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Tharindu (IT25102241) — Trip Progress & Telemetry
 * Role      : Concrete Subject (THE core class of this pattern)
 * ─────────────────────────────────────────────────────────────────
 *
 * This is the heart of the Observer pattern implementation.
 * It maintains a list of TripStatusObservers and broadcasts
 * trip status change events to ALL registered observers.
 *
 * BEFORE (problem — scattered inline calls in 3 services):
 *   messagingTemplate.convertAndSendToUser(email, "/queue/trip/" + id, payload);
 *   messagingTemplate.convertAndSendToUser(email, "/queue/trip/" + id, payload);
 *   messagingTemplate.convertAndSendToUser(email, "/queue/trip/" + id, payload);
 *
 * AFTER (with Observer pattern — single publisher call):
 *   tripEventPublisher.notifyTripStatusObservers(tripId, email, newStatus);
 *   // All registered observers are called automatically.
 *
 * Lecture Reference (Lecture B, Slide 37):
 *   "notifyObservers iterates through the observers and calls their
 *    update() method, passing the current state."
 *
 * Spring @Component ensures exactly ONE instance is created
 * (application-scoped singleton by the IoC container).
 */
@Component
public class TripEventPublisher implements TripEventSubject {

    // The list of all registered observers — maintained by this subject
    private final List<TripStatusObserver> observers = new ArrayList<>();

    /**
     * Auto-register all concrete observers after Spring initialises them.
     * This wires up WebSocketTripObserver automatically at startup.
     *
     * All TripStatusObserver @Component beans are injected by Spring
     * and registered here during application startup.
     */
    private final List<TripStatusObserver> autoRegistered;

    public TripEventPublisher(List<TripStatusObserver> autoRegistered) {
        this.autoRegistered = autoRegistered;
    }

    @PostConstruct
    public void init() {
        // Register all Spring-managed TripStatusObserver beans automatically
        observers.addAll(autoRegistered);
        System.out.println("[TripEventPublisher] Initialised with "
                + observers.size() + " observer(s): "
                + autoRegistered.stream()
                                .map(o -> o.getClass().getSimpleName())
                                .toList());
    }

    // ─── Subject interface implementation ────────────────────────────────────

    /**
     * Registers a new observer at runtime.
     * Example: admin monitoring dashboard subscribes dynamically.
     */
    @Override
    public void addObserver(TripStatusObserver observer) {
        if (!observers.contains(observer)) {
            observers.add(observer);
            System.out.println("[TripEventPublisher] Observer added: "
                    + observer.getClass().getSimpleName());
        }
    }

    /**
     * Removes an observer. It will no longer receive trip status events.
     */
    @Override
    public void removeObserver(TripStatusObserver observer) {
        observers.remove(observer);
        System.out.println("[TripEventPublisher] Observer removed: "
                + observer.getClass().getSimpleName());
    }

    /**
     * Broadcasts a trip status change to ALL registered observers.
     *
     * Called by TripTrackingService and DispatchService whenever
     * a trip moves through its state machine lifecycle:
     *   REQUESTED → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
     *
     * @param tripId         ID of the trip whose status changed
     * @param passengerEmail passenger's email (for WS user-routing)
     * @param newStatus      the new TripStatus name (e.g. "COMPLETED")
     */
    @Override
    public void notifyTripStatusObservers(Long tripId, String passengerEmail, String newStatus) {
        System.out.println("[TripEventPublisher] Notifying " + observers.size()
                + " observer(s) — Trip #" + tripId + " → " + newStatus);

        for (TripStatusObserver observer : observers) {
            observer.onTripStatusChanged(tripId, passengerEmail, newStatus);
        }
    }

    /**
     * Returns an unmodifiable view of currently registered observers.
     * Useful for admin diagnostics or testing.
     */
    @Override
    public List<TripStatusObserver> getObservers() {
        return Collections.unmodifiableList(observers);
    }
}
