package com.streetify.observer;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * WebSocketTripObserver — ConcreteObserver (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Tharindu (IT25102241) — Trip Progress & Telemetry
 * Role      : Concrete Observer — WebSocket push notification
 * ─────────────────────────────────────────────────────────────────
 *
 * This ConcreteObserver reacts to trip status change events by
 * pushing a real-time WebSocket notification to the passenger's
 * private queue.
 *
 * BEFORE (the problem — 3 identical inline calls scattered across services):
 *
 *   // In TripTrackingService.updateTripStatus():
 *   messagingTemplate.convertAndSendToUser(
 *       trip.getPassenger().getEmail(),
 *       "/queue/trip/" + trip.getId(),
 *       new TripStatusNotification(trip.getId(), newStatus.name())
 *   );
 *
 *   // In TripTrackingService.cancelNoShow():
 *   messagingTemplate.convertAndSendToUser( ... );    // DUPLICATE
 *
 *   // In DispatchService.cancelTrip():
 *   messagingTemplate.convertAndSendToUser( ... );    // DUPLICATE
 *
 * AFTER (with Observer pattern — this class handles ALL WS pushes):
 *   Services call: tripEventPublisher.notifyTripStatusObservers(...)
 *   This observer fires automatically — no inline messaging code needed.
 *
 * Lecture Reference (Lecture B, Slide 41):
 *   "ConcreteObserver implements the Observer interface and reacts
 *    to subject updates."
 *
 * WebSocket destination used:
 *   /user/{passengerEmail}/queue/trip/{tripId}
 */
@Component
public class WebSocketTripObserver implements TripStatusObserver {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketTripObserver(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Reacts to a trip status change by pushing a WebSocket message
     * to the passenger's private queue.
     *
     * This method is automatically called by TripEventPublisher
     * (the ConcreteSubject) whenever notifyTripStatusObservers() fires.
     *
     * @param tripId         the trip that changed status
     * @param passengerEmail the passenger's email — used by Spring's
     *                       STOMP user-destination routing to deliver
     *                       the message to exactly that user's session
     * @param newStatus      the new TripStatus name string
     */
    @Override
    @SuppressWarnings("null")
    public void onTripStatusChanged(Long tripId, String passengerEmail, String newStatus) {
        // Build the notification payload
        Map<String, Object> payload = Map.of(
                "tripId", tripId,
                "status", newStatus,
                "message", buildStatusMessage(newStatus)
        );

        // Push to passenger's private WebSocket queue
        // Spring STOMP routes this to: /user/{passengerEmail}/queue/trip/{tripId}
        messagingTemplate.convertAndSendToUser(
                passengerEmail,
                "/queue/trip/" + tripId,
                payload
        );

        System.out.println("[WebSocketTripObserver] Pushed status '" + newStatus
                + "' to passenger: " + passengerEmail + " for trip #" + tripId);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Converts a raw TripStatus name into a human-readable message
     * shown on the passenger's app screen.
     */
    private String buildStatusMessage(String status) {
        return switch (status.toUpperCase()) {
            case "ACCEPTED"    -> "Driver found! On the way to pick you up.";
            case "EN_ROUTE"    -> "Your driver is navigating to your location.";
            case "ARRIVED"     -> "Your driver has arrived at the pickup point!";
            case "IN_PROGRESS" -> "Trip started. Enjoy your ride!";
            case "COMPLETED"   -> "Trip completed. Please rate your experience.";
            case "CANCELLED"   -> "Your trip has been cancelled.";
            case "CANCELLED_NO_SHOW" -> "Trip cancelled — no-show fee of LKR 100 applied.";
            default            -> "Trip status updated: " + status;
        };
    }
}
