package com.streetify.observer;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * DriverVerificationObserver — ConcreteObserver (GoF Observer Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Observer (Behavioral)
 * Member    : Lahiru (IT25102208) — User Account & Verification Module
 * Role      : Concrete Observer 1 — WebSocket notification to driver
 * ─────────────────────────────────────────────────────────────────
 *
 * When a staff member approves or rejects a driver's documents in
 * DriverVerificationService.reviewDocument(), this observer is
 * automatically triggered and pushes a real-time WebSocket notification
 * to the driver informing them of their verification outcome.
 *
 * Lecture Reference (Lecture B, Slide 41-42):
 *   "ConcreteObserver: Implements the observer interface and reacts
 *    to subject updates. It has a method update() that sets the new
 *    message and calls the display() method."
 *
 * This observer is registered with VerificationEventPublisher at startup.
 * DriverVerificationService calls the publisher — this class fires automatically.
 *
 * WebSocket destination:
 *   /user/{driverId}/queue/notifications
 */
@Component
public class DriverVerificationObserver implements VerificationObserver {

    private final SimpMessagingTemplate messagingTemplate;

    public DriverVerificationObserver(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Reacts to a verification status change by pushing a WebSocket
     * notification directly to the affected driver's private queue.
     *
     * Called automatically by VerificationEventPublisher when
     * DriverVerificationService processes a document approval/rejection.
     *
     * @param driverId  the driver's ID (used to route the WS message)
     * @param newStatus "APPROVED", "REJECTED", or "PENDING_VERIFICATION"
     * @param note      the reviewer's note (displayed to the driver)
     */
    @Override
    @SuppressWarnings("null")
    public void onVerificationStatusChanged(Long driverId, String newStatus, String note) {
        // Build the notification payload for the driver's app
        Map<String, Object> payload = Map.of(
                "type",    "VERIFICATION_UPDATE",
                "status",  newStatus,
                "note",    note != null ? note : "",
                "message", buildDriverMessage(newStatus)
        );

        // Push to driver's private WebSocket notification queue
        // Spring STOMP routes to: /user/{driverId}/queue/notifications
        messagingTemplate.convertAndSendToUser(
                driverId.toString(),
                "/queue/notifications",
                payload
        );

        System.out.println("[DriverVerificationObserver] Notified Driver #"
                + driverId + " — Status: " + newStatus);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Builds a human-readable notification message based on the new status.
     */
    private String buildDriverMessage(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED" ->
                "🎉 Congratulations! All your documents have been verified. " +
                "You can now log in and start accepting trips on Streetify.";
            case "REJECTED" ->
                "❌ One or more of your documents were rejected. " +
                "Please review the feedback and re-upload the required documents.";
            case "PENDING_VERIFICATION" ->
                "⏳ Your documents have been received and are under review. " +
                "You will be notified once the verification is complete.";
            default ->
                "Your verification status has been updated to: " + status;
        };
    }
}
