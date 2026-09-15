package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dto.TelemetryDTO;
import com.streetify.dto.TripStatusUpdateDTO;
import com.streetify.entity.Trip;
import com.streetify.entity.TripStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * TripTrackingService — Trip state machine transitions and live telemetry.
 *
 * Responsibilities:
 *   1. Advance trip through state machine (EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED)
 *   2. Detect no-show (driver waiting > 5 min at pickup) and apply no-show fee
 *   3. Process driver GPS telemetry and broadcast to:
 *      - Passenger private queue: /user/{email}/queue/trip/{tripId}
 *      - Admin fleet monitor: /topic/fleet
 *
 * State transitions match Driver.tsx STATE_ORDER:
 *   assigned → en_route → arrived → in_trip → completed
 */
@Service
@Transactional
public class TripTrackingService {

    private static final double NO_SHOW_FEE_LKR = 100.0; // LKR penalty for no-show
    private static final int NO_SHOW_THRESHOLD_MINUTES = 5;

    private final TripDAO tripDAO;
    private final DriverDAO driverDAO;
    private final SimpMessagingTemplate messagingTemplate;

    public TripTrackingService(TripDAO tripDAO,
                               DriverDAO driverDAO,
                               SimpMessagingTemplate messagingTemplate) {
        this.tripDAO = tripDAO;
        this.driverDAO = driverDAO;
        this.messagingTemplate = messagingTemplate;
    }

    // ─── Status Transition ────────────────────────────────────────────────────

    /**
     * Transitions a trip's status following the state machine rules.
     *
     * Valid transitions:
     *   ACCEPTED    → EN_ROUTE   (driver starts navigating)
     *   EN_ROUTE    → ARRIVED    (driver reaches pickup — starts 5-min timer)
     *   ARRIVED     → IN_PROGRESS (passenger boards)
     *   IN_PROGRESS → COMPLETED  (trip ends → triggers payment)
     *   Any state   → CANCELLED  (with no-show check)
     *
     * @param driverId the authenticated driver's ID
     * @param dto      TripStatusUpdateDTO { tripId, status }
     */
    public Trip updateTripStatus(Long driverId, TripStatusUpdateDTO dto) {
        Trip trip = tripDAO.findById(dto.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + dto.getTripId()));

        // Ensure the driver owns this trip
        if (trip.getDriver() == null || !trip.getDriver().getId().equals(driverId)) {
            throw new SecurityException("You are not assigned to this trip.");
        }

        TripStatus newStatus = TripStatus.valueOf(dto.getStatus().toUpperCase());
        validateTransition(trip.getStatus(), newStatus);

        // Apply state-specific logic
        switch (newStatus) {
            case EN_ROUTE -> tripDAO.updateTripStatus(trip.getId(), TripStatus.EN_ROUTE);

            case ARRIVED -> tripDAO.markArrived(trip.getId(), LocalDateTime.now());

            case IN_PROGRESS -> tripDAO.markInProgress(trip.getId(), LocalDateTime.now());

            case COMPLETED -> tripDAO.markCompleted(trip.getId(), LocalDateTime.now());

            case CANCELLED -> handleCancellation(trip, dto.getCancellationReason());

            default -> throw new IllegalArgumentException("Cannot manually set status: " + newStatus);
        }

        // Reload updated trip
        Trip updated = tripDAO.findById(trip.getId()).orElseThrow();

        // Notify passenger of status change via private WebSocket queue
        messagingTemplate.convertAndSendToUser(
                trip.getPassenger().getEmail(),
                "/queue/trip/" + trip.getId(),
                new TripStatusNotification(trip.getId(), newStatus.name())
        );

        return updated;
    }

    // ─── No-Show Cancellation ─────────────────────────────────────────────────

    /**
     * Cancels a trip due to passenger no-show.
     * Eligible if driver has been at ARRIVED status for > 5 minutes.
     *
     * No-show fee (LKR 100) is charged to the passenger.
     *
     * @param driverId the authenticated driver's ID
     * @param tripId   the trip to cancel
     */
    public Trip cancelNoShow(Long driverId, Long tripId) {
        Trip trip = tripDAO.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + tripId));

        if (trip.getStatus() != TripStatus.ARRIVED) {
            throw new IllegalStateException("No-show cancellation only valid when status is ARRIVED.");
        }

        // Check 5-minute threshold
        if (trip.getArrivedAt() == null) {
            throw new IllegalStateException("Arrival time not recorded for this trip.");
        }

        long minutesWaiting = Duration.between(trip.getArrivedAt(), LocalDateTime.now()).toMinutes();
        if (minutesWaiting < NO_SHOW_THRESHOLD_MINUTES) {
            long remaining = NO_SHOW_THRESHOLD_MINUTES - minutesWaiting;
            throw new IllegalStateException(
                    "No-show cancellation available after 5 minutes. " +
                    remaining + " minute(s) remaining."
            );
        }

        // Apply no-show fee and cancel
        trip.setStatus(TripStatus.CANCELLED);
        trip.setCancellationReason("PASSENGER_NO_SHOW");
        trip.setCancelledAt(LocalDateTime.now());
        trip.setNoShowFee(NO_SHOW_FEE_LKR);
        tripDAO.save(trip);

        // Notify passenger
        messagingTemplate.convertAndSendToUser(
                trip.getPassenger().getEmail(),
                "/queue/trip/" + tripId,
                new TripStatusNotification(tripId, "CANCELLED_NO_SHOW")
        );

        return trip;
    }

    // ─── Live Telemetry ───────────────────────────────────────────────────────

    /**
     * Processes incoming GPS telemetry from a driver.
     * Called by @MessageMapping("/telemetry") in TripTrackingController.
     *
     * Actions:
     *   1. Persist driver's current location to DB
     *   2. Broadcast to the trip's passenger private queue
     *   3. Broadcast all driver positions to admin fleet monitor (/topic/fleet)
     *
     * @param driverId    the authenticated driver's ID (from WS Principal)
     * @param telemetryDTO { lat, lng, heading, speedKmh, tripId, etaMinutes }
     */
    public void processTelemetry(Long driverId, TelemetryDTO telemetryDTO) {
        telemetryDTO.setDriverId(driverId);

        // Update driver's location in DB (best-effort, non-blocking)
        driverDAO.updateCurrentLocation(driverId, telemetryDTO.getLat(), telemetryDTO.getLng());

        // Broadcast to passenger's private queue (if in active trip)
        if (telemetryDTO.getTripId() != null) {
            Optional<Trip> tripOpt = tripDAO.findById(telemetryDTO.getTripId());
            tripOpt.ifPresent(trip -> {
                telemetryDTO.setTripStatus(trip.getStatus().name());
                messagingTemplate.convertAndSendToUser(
                        trip.getPassenger().getEmail(),
                        "/queue/trip/" + telemetryDTO.getTripId(),
                        telemetryDTO
                );
            });
        }

        // Broadcast to admin fleet monitor
        messagingTemplate.convertAndSend("/topic/fleet", telemetryDTO);
    }

    /**
     * Get the current active trip for a driver.
     * API: GET /api/trips/current
     */
    @Transactional(readOnly = true)
    public Optional<Trip> getCurrentTrip(Long driverId) {
        return tripDAO.findActiveTrip_ByDriverId(driverId);
    }

    // ─── State Machine Validation ─────────────────────────────────────────────

    /**
     * Validates that a state transition is legal.
     * Throws IllegalStateException if the transition is invalid.
     */
    private void validateTransition(TripStatus current, TripStatus next) {
        boolean valid = switch (current) {
            case ACCEPTED    -> next == TripStatus.EN_ROUTE || next == TripStatus.CANCELLED;
            case EN_ROUTE    -> next == TripStatus.ARRIVED  || next == TripStatus.CANCELLED;
            case ARRIVED     -> next == TripStatus.IN_PROGRESS || next == TripStatus.CANCELLED;
            case IN_PROGRESS -> next == TripStatus.COMPLETED;
            default          -> false;
        };

        if (!valid) {
            throw new IllegalStateException(
                    "Invalid trip state transition: " + current + " → " + next
            );
        }
    }

    private void handleCancellation(Trip trip, String reason) {
        trip.setStatus(TripStatus.CANCELLED);
        trip.setCancellationReason(reason != null ? reason : "DRIVER_CANCELLED");
        trip.setCancelledAt(LocalDateTime.now());
        tripDAO.save(trip);
    }

    // ─── Inner Record (inline notification payload) ───────────────────────────

    public record TripStatusNotification(Long tripId, String status) {}
}
