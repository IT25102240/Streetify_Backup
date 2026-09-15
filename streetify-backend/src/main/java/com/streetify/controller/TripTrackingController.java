package com.streetify.controller;

import com.streetify.dto.TelemetryDTO;
import com.streetify.dto.TripStatusUpdateDTO;
import com.streetify.entity.Trip;
import com.streetify.security.JwtUtil;
import com.streetify.service.TripTrackingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * TripTrackingController — Trip state machine (REST) + Live GPS telemetry (WebSocket).
 *
 * REST Routes:
 *   PUT  /api/trips/{id}/status          → Advance trip state (DRIVER)
 *   POST /api/trips/{id}/noshow          → Cancel no-show after 5 min (DRIVER)
 *   GET  /api/trips/current              → Get driver's active trip (DRIVER)
 *
 * WebSocket Message Mappings:
 *   @MessageMapping("/telemetry")        → Driver sends GPS position
 *     ↳ broadcasts to /user/{passengerEmail}/queue/trip/{tripId}
 *     ↳ broadcasts to /topic/fleet (admin monitor)
 *
 * Note: @Controller (not @RestController) — needed to mix REST and WS handlers.
 */
@Controller
@RequestMapping("/api/trips")
public class TripTrackingController {

    private final TripTrackingService trackingService;
    private final JwtUtil jwtUtil;

    public TripTrackingController(TripTrackingService trackingService, JwtUtil jwtUtil) {
        this.trackingService = trackingService;
        this.jwtUtil = jwtUtil;
    }

    // ─── REST: Status Transition ──────────────────────────────────────────────

    /**
     * PUT /api/trips/{id}/status
     *
     * Driver advances the trip through the state machine:
     *   EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
     *
     * Frontend: Driver.tsx action buttons (e.g., "Start Navigation", "I Have Arrived")
     *
     * @param id            the trip ID (path variable)
     * @param dto           TripStatusUpdateDTO { tripId, status }
     * @param authorization Bearer token
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateTripStatus(
            @PathVariable Long id,
            @Valid @RequestBody TripStatusUpdateDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        dto.setTripId(id); // ensure path var matches DTO
        Long driverId = extractUserId(authorization);
        Trip updated = trackingService.updateTripStatus(driverId, dto);

        return ResponseEntity.ok(Map.of(
                "tripId",  updated.getId(),
                "status",  updated.getStatus().name(),
                "message", "Trip status updated to " + updated.getStatus().name()
        ));
    }

    // ─── REST: No-Show Cancellation ───────────────────────────────────────────

    /**
     * POST /api/trips/{id}/noshow
     *
     * Driver cancels trip after passenger no-show (≥ 5 minutes at pickup).
     * Applies LKR 100 no-show fee to passenger.
     * Frontend: Driver.tsx "Cancel Trip" button after 5-min warning.
     */
    @PostMapping("/{id}/noshow")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reportNoShow(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authorization
    ) {
        Long driverId = extractUserId(authorization);
        Trip cancelled = trackingService.cancelNoShow(driverId, id);

        return ResponseEntity.ok(Map.of(
                "cancelled",  true,
                "tripId",     cancelled.getId(),
                "noShowFee",  cancelled.getNoShowFee(),
                "message",    "Trip cancelled due to passenger no-show. Fee applied: LKR " + cancelled.getNoShowFee()
        ));
    }

    // ─── REST: Current Trip (Driver) ─────────────────────────────────────────

    /**
     * GET /api/trips/current
     *
     * Returns the driver's currently active trip (if any).
     * Frontend: Driver.tsx loads this on dashboard mount.
     */
    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    @ResponseBody
    public ResponseEntity<?> getCurrentTrip(
            @RequestHeader("Authorization") String authorization
    ) {
        Long driverId = extractUserId(authorization);
        return trackingService.getCurrentTrip(driverId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // ─── WebSocket: Live Telemetry ────────────────────────────────────────────

    /**
     * WebSocket message handler — driver sends GPS coordinates.
     *
     * Client sends to: /app/telemetry (STOMP destination prefix /app)
     * Server routes to: /user/{passengerEmail}/queue/trip/{tripId}
     *                   /topic/fleet (admin)
     *
     * Payload: TelemetryDTO { lat, lng, heading, speedKmh, tripId, etaMinutes }
     *
     * @param telemetryDTO  the incoming telemetry message (Spring auto-deserializes)
     * @param principal     the authenticated STOMP Principal (set by WebSocketConfig JWT interceptor)
     */
    @MessageMapping("/telemetry")
    public void handleTelemetry(
            @Payload TelemetryDTO telemetryDTO,
            Principal principal
    ) {
        if (principal == null) return; // Reject unauthenticated messages

        // Extract driver ID from the authenticated STOMP Principal name (email)
        // In a production system, store a driverId→email mapping in Redis
        // For now, we rely on the driverId from the telemetry payload itself
        // (Set by the client from their JWT-decoded userId)
        trackingService.processTelemetry(telemetryDTO.getDriverId(), telemetryDTO);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Long extractUserId(String authorization) {
        return jwtUtil.extractUserId(authorization.substring(7));
    }
}
