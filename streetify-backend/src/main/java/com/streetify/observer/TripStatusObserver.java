package com.streetify.observer;

/**
 * TripStatusObserver — Observer Interface (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Tharindu (IT25102241) — Trip Progress & Telemetry
 * Role      : Observer Interface
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the contract that every concrete observer must implement.
 * Any class that wants to be notified about trip status changes
 * must implement this interface.
 *
 * Lecture Reference (Lecture B, Slide 36):
 *   "The Observer interface defines a contract for objects that want
 *    to be notified about changes in the subject."
 *
 * Concrete implementations:
 *   → WebSocketTripObserver  (pushes live update to passenger via WS)
 *   → AuditLogObserver       (can be added later without changing subject)
 */
public interface TripStatusObserver {

    /**
     * Called by TripEventPublisher (the ConcreteSubject) whenever
     * a trip's status changes.
     *
     * @param tripId         the ID of the trip whose status changed
     * @param passengerEmail the email of the passenger on this trip
     *                       (used to route WS messages to the right user)
     * @param newStatus      the new TripStatus value as a String
     *                       (e.g. "EN_ROUTE", "ARRIVED", "COMPLETED")
     */
    void onTripStatusChanged(Long tripId, String passengerEmail, String newStatus);
}
