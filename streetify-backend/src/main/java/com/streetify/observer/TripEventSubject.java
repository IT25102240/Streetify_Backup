package com.streetify.observer;

import java.util.List;

/**
 * TripEventSubject — Subject Interface (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Tharindu (IT25102241) — Trip Progress & Telemetry
 * Role      : Subject Interface
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the contract for the ConcreteSubject (TripEventPublisher).
 * Any subject that manages a list of TripStatusObservers and can
 * broadcast trip status changes must implement this interface.
 *
 * Lecture Reference (Lecture B, Slide 35):
 *   "The Subject interface outlines the operations a subject should
 *    support. addObserver and removeObserver are for managing the
 *    list of observers. notifyObservers is for informing observers
 *    about changes."
 */
public interface TripEventSubject {

    /**
     * Registers a new observer to receive trip status notifications.
     *
     * @param observer the TripStatusObserver to add
     */
    void addObserver(TripStatusObserver observer);

    /**
     * Unregisters an observer — it will no longer receive notifications.
     *
     * @param observer the TripStatusObserver to remove
     */
    void removeObserver(TripStatusObserver observer);

    /**
     * Broadcasts a trip status change event to ALL registered observers.
     *
     * @param tripId         the trip whose status changed
     * @param passengerEmail the passenger email (for WS routing)
     * @param newStatus      the new status string (e.g. "COMPLETED")
     */
    void notifyTripStatusObservers(Long tripId, String passengerEmail, String newStatus);

    /**
     * Returns the current list of registered observers (for debugging/testing).
     *
     * @return unmodifiable view of registered observers
     */
    List<TripStatusObserver> getObservers();
}
