package com.streetify.controller;

import com.streetify.dto.FareEstimateDTO;
import com.streetify.dto.TripRequestDTO;
import com.streetify.dto.TripResponseDTO;
import com.streetify.dto.AvailableTripDTO;
import com.streetify.entity.Trip;
import com.streetify.security.JwtUtil;
import com.streetify.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TripController — Ride booking and dispatch REST endpoints.
 *
 * Routes:
 *   POST /api/rides/estimate   → Fare estimate (PASSENGER)
 *   POST /api/rides/book       → Book a trip (PASSENGER)
 *   POST /api/rides/accept/{tripId} → Driver accepts a trip (DRIVER)
 *   GET  /api/rides/available  → List REQUESTED trips (DRIVER)
 *   GET  /api/rides/history    → Passenger trip history (PASSENGER)
 *
 * All bodies bound via @RequestBody + DTOs. No manual JSON extraction.
 */
@RestController
@RequestMapping("/api/rides")
public class TripController {

    private final DispatchService dispatchService;
    private final JwtUtil jwtUtil;

    public TripController(DispatchService dispatchService, JwtUtil jwtUtil) {
        this.dispatchService = dispatchService;
        this.jwtUtil = jwtUtil;
    }

    // ─── Fare Estimation ─────────────────────────────────────────────────────

    /**
     * POST /api/rides/estimate
     *
     * Calculates fare for given pickup/dropoff and ride type.
     * Frontend: Booking.tsx "Get Fare Estimate" button.
     *
     * @param dto TripRequestDTO with coordinates and rideType
     */
    @PostMapping("/estimate")
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<FareEstimateDTO> estimateFare(
            @Valid @RequestBody TripRequestDTO dto
    ) {
        FareEstimateDTO estimate = dispatchService.estimateFare(dto);
        return ResponseEntity.ok(estimate);
    }

    // ─── Book Trip ────────────────────────────────────────────────────────────

    /**
     * POST /api/rides/book
     *
     * Books a ride for the authenticated passenger.
     * Saves trip to DB and broadcasts to drivers via WebSocket /topic/trips.
     * Frontend: Booking.tsx "Book <type> — LKR xxx" button.
     *
     * @param dto           TripRequestDTO
     * @param authorization Bearer token from Authorization header
     */
    @PostMapping("/book")
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<TripResponseDTO> bookTrip(
            @Valid @RequestBody TripRequestDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        Long passengerId = extractUserId(authorization);
        TripResponseDTO response = dispatchService.bookTrip(passengerId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── Accept Trip (Driver) ─────────────────────────────────────────────────

    /**
     * POST /api/rides/accept/{tripId}
     *
     * Driver accepts an available trip request.
     * Notifies passenger via WebSocket /user/{email}/queue/trips.
     * Frontend: Driver.tsx "Accept Trip" button.
     *
     * @param tripId        the trip to accept
     * @param authorization Bearer token
     */
    @PostMapping("/accept/{tripId}")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    public ResponseEntity<TripResponseDTO> acceptTrip(
            @PathVariable Long tripId,
            @RequestHeader("Authorization") String authorization
    ) {
        Long driverId = extractUserId(authorization);
        TripResponseDTO response = dispatchService.acceptTrip(driverId, tripId);
        return ResponseEntity.ok(response);
    }

    // ─── Available Trips (Driver) ─────────────────────────────────────────────

    /**
     * GET /api/rides/available
     *
     * Returns all REQUESTED (unmatched) trips in the system.
     * Drivers see this list to manually accept if needed.
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    public ResponseEntity<List<AvailableTripDTO>> getAvailableTrips() {
        return ResponseEntity.ok(dispatchService.getRequestedTrips());
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Long extractUserId(String authorization) {
        String token = authorization.substring(7); // Remove "Bearer "
        return jwtUtil.extractUserId(token);
    }
}
