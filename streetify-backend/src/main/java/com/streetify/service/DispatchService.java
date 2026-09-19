package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.PassengerDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dto.FareEstimateDTO;
import com.streetify.dto.TripRequestDTO;
import com.streetify.dto.TripResponseDTO;
import com.streetify.entity.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.streetify.dto.AvailableTripDTO;

import java.util.List;
import java.util.Map;

/**
 * DispatchService — Fare calculation and trip booking with WebSocket broadcast.
 *
 * Responsibilities:
 *   1. Calculate fare estimate using Haversine distance formula
 *   2. Book a trip (save to DB)
 *   3. Broadcast the new trip request to all online drivers via WebSocket
 *
 * Fare Rates (LKR — matches Booking.tsx frontend RIDE_TYPES):
 *   standard: base=200, perKm=33
 *   xl:       base=340, perKm=48
 *   moto:     base=80,  perKm=18
 *   platformFee: 4 LKR fixed
 */
@Service
@Transactional
@SuppressWarnings("null")
public class DispatchService {

    private final TripDAO tripDAO;
    private final PassengerDAO passengerDAO;
    private final DriverDAO driverDAO;
    private final SimpMessagingTemplate messagingTemplate;

    // Fare configuration — matches Booking.tsx RIDE_TYPES constants
    private static final Map<String, double[]> FARE_CONFIG = Map.of(
            "standard", new double[]{200.0, 33.0},  // {baseFare, perKmRate}
            "xl",       new double[]{340.0, 48.0},
            "moto",     new double[]{80.0,  18.0}
    );
    private static final double PLATFORM_FEE = 4.0;

    public DispatchService(TripDAO tripDAO,
                           PassengerDAO passengerDAO,
                           DriverDAO driverDAO,
                           SimpMessagingTemplate messagingTemplate) {
        this.tripDAO = tripDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.messagingTemplate = messagingTemplate;
    }

    // ─── Fare Estimation ─────────────────────────────────────────────────────

    /**
     * Calculates a fare estimate for a given route and ride type.
     * Distance is computed using the Haversine formula (great-circle distance).
     *
     * @param dto TripRequestDTO with pickup/dropoff coordinates and rideType
     * @return FareEstimateDTO with full LKR breakdown
     */
    @Transactional(readOnly = true)
    public FareEstimateDTO estimateFare(TripRequestDTO dto) {
        double[] rates = getFareRates(dto.getRideType());
        double baseFare = rates[0];
        double perKmRate = rates[1];

        double distanceKm = haversineDistance(
                dto.getPickupLat(), dto.getPickupLng(),
                dto.getDropoffLat(), dto.getDropoffLng()
        );
        double distanceKm2dp = Math.round(distanceKm * 100.0) / 100.0;

        double distanceCharge = distanceKm2dp * perKmRate;
        double totalFare = baseFare + distanceCharge + PLATFORM_FEE;
        int estimatedMinutes = (int) Math.ceil(distanceKm2dp * 2.5); // ~40 km/h in Colombo traffic

        return FareEstimateDTO.builder()
                .rideType(dto.getRideType())
                .distanceKm(distanceKm2dp)
                .estimatedDurationMinutes(estimatedMinutes)
                .baseFare(baseFare)
                .perKmRate(perKmRate)
                .distanceCharge(Math.round(distanceCharge * 100.0) / 100.0)
                .platformFee(PLATFORM_FEE)
                .totalFare((double) Math.round(totalFare))
                .currency("LKR")
                .build();
    }

    // ─── Trip Booking ─────────────────────────────────────────────────────────

    /**
     * Books a trip for a passenger:
     *   1. Prevent double booking (one active trip per passenger)
     *   2. Calculate fare
     *   3. Persist Trip to DB
     *   4. Broadcast TripRequestDTO to all online drivers via WebSocket /topic/trips
     *
     * @param passengerId the authenticated passenger's ID (from JWT)
     * @param dto         TripRequestDTO from @RequestBody
     * @return TripResponseDTO with tripId and REQUESTED status
     */
    public TripResponseDTO bookTrip(Long passengerId, TripRequestDTO dto) {
        // Step 1: Prevent double booking (automatically cancel old active trips for testing convenience)
        tripDAO.findActiveTrip_ByPassengerId(passengerId).ifPresent(t -> {
            t.setStatus(TripStatus.CANCELLED);
            tripDAO.save(t);
        });

        // Step 2: Load passenger
        Passenger passenger = passengerDAO.findById(passengerId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found."));

        // Step 3: Calculate fare
        FareEstimateDTO fare = estimateFare(dto);

        // Step 4: Build Trip entity
        Trip trip = Trip.builder()
                .passenger(passenger)
                .pickupAddress(dto.getPickupAddress())
                .pickupLat(dto.getPickupLat())
                .pickupLng(dto.getPickupLng())
                .dropoffAddress(dto.getDropoffAddress())
                .dropoffLat(dto.getDropoffLat())
                .dropoffLng(dto.getDropoffLng())
                .distanceKm(fare.getDistanceKm())
                .rideType(dto.getRideType())
                .baseFare(fare.getBaseFare())
                .perKmRate(fare.getPerKmRate())
                .platformFee(fare.getPlatformFee())
                .totalFare(fare.getTotalFare())
                .platformCommission(Math.round(fare.getTotalFare() * 0.15 * 100.0) / 100.0)
                .driverNet(Math.round(fare.getTotalFare() * 0.85 * 100.0) / 100.0)
                .paymentMethod(dto.getPaymentMethod())
                .status(TripStatus.REQUESTED)
                .build();

        Trip saved = tripDAO.save(trip);

        // Step 5: Broadcast to all online drivers via WebSocket
        // Drivers subscribed to /topic/trips will receive this
        TripResponseDTO tripBroadcast = TripResponseDTO.builder()
                .tripId(saved.getId())
                .status(TripStatus.REQUESTED.name())
                .totalFare(saved.getTotalFare())
                .currency("LKR")
                .message("New trip request in your area!")
                .build();

        messagingTemplate.convertAndSend("/topic/trips", tripBroadcast);

        return TripResponseDTO.builder()
                .tripId(saved.getId())
                .status(TripStatus.REQUESTED.name())
                .totalFare(saved.getTotalFare())
                .currency("LKR")
                .message("Trip booked! Searching for a driver near you...")
                .build();
    }

    /**
     * Driver accepts a trip request.
     *
     * @param driverId the authenticated driver's ID
     * @param tripId   the trip to accept
     * @return updated TripResponseDTO
     */
    public TripResponseDTO acceptTrip(Long driverId, Long tripId) {
        Driver driver = driverDAO.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found."));

        Trip trip = tripDAO.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found."));

        if (trip.getStatus() != TripStatus.REQUESTED) {
            throw new IllegalStateException("This trip is no longer available.");
        }

        // Assign driver
        tripDAO.assignDriverToTrip(tripId, driverId, java.time.LocalDateTime.now());

        // Notify the passenger via their private queue: /user/{passengerEmail}/queue/trips
        TripResponseDTO notification = TripResponseDTO.builder()
                .tripId(tripId)
                .status(TripStatus.ACCEPTED.name())
                .driverId(driverId)
                .driverName(driver.getFullName())
                .driverPhone(driver.getPhone())
                .vehiclePlate(driver.getVehicle() != null ? driver.getVehicle().getNumberPlate() : "")
                .driverRating(driver.getAverageRating())
                .etaMinutes(5) // default ETA — updated via telemetry
                .totalFare(trip.getTotalFare())
                .message("Driver found! " + driver.getFullName() + " is on the way.")
                .build();

        // Broadcast to passenger's private queue
        messagingTemplate.convertAndSendToUser(
                trip.getPassenger().getEmail(),
                "/queue/trips",
                notification
        );

        return notification;
    }

    /**
     * Get all currently REQUESTED (unmatched) trips.
     * Used by drivers to see available trips.
     */
    @Transactional(readOnly = true)
    public List<AvailableTripDTO> getRequestedTrips() {
        List<Trip> trips = tripDAO.findAllRequestedTrips();
        return trips.stream().map(t -> {
            AvailableTripDTO dto = new AvailableTripDTO();
            dto.setId(t.getId());
            dto.setPassengerName(t.getPassenger() != null ? t.getPassenger().getFullName() : "Passenger");
            dto.setPickupAddress(t.getPickupAddress());
            dto.setDropoffAddress(t.getDropoffAddress());
            dto.setEstimatedFare(t.getTotalFare());
            dto.setEstimatedDistanceKm(t.getDistanceKm());
            
            Double commission = t.getPlatformCommission();
            if (commission == null && t.getTotalFare() != null) {
                commission = (double) Math.round(t.getTotalFare() * 0.15);
            }
            dto.setPlatformCommission(commission);
            return dto;
        }).toList();
    }

    /**
     * Get trip history for a passenger (newest first).
     * Used by GET /api/rides/history.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPassengerHistory(Long passengerId) {
        List<Trip> trips = tripDAO.findByPassengerIdOrderByCreatedAtDesc(passengerId);
        return trips.stream().map(t -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", "RIDE-" + t.getId());
            m.put("date", t.getCreatedAt() != null ? t.getCreatedAt().toLocalDate().toString() : "");
            m.put("time", t.getCreatedAt() != null ? t.getCreatedAt().toLocalTime().toString().substring(0,5) : "");
            m.put("from", t.getPickupAddress());
            m.put("to", t.getDropoffAddress());
            m.put("driver", t.getDriver() != null ? t.getDriver().getFullName() : "N/A");
            m.put("fare", "LKR " + (t.getTotalFare() != null ? Math.round(t.getTotalFare()) : 0));
            m.put("fareAmount", t.getTotalFare() != null ? t.getTotalFare() : 0.0);
            m.put("km", t.getDistanceKm() != null ? String.valueOf(Math.round(t.getDistanceKm() * 10.0) / 10.0) : "0");
            m.put("status", t.getStatus() != null ? t.getStatus().name().toLowerCase() : "unknown");
            m.put("method", t.getPaymentMethod() != null ? t.getPaymentMethod().toLowerCase() : "cash");
            return m;
        }).toList();
    }

    /**
     * Get trip history for a driver (newest first).
     * Used by GET /api/rides/driver/history.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDriverHistory(Long driverId) {
        List<Trip> trips = tripDAO.findByDriverIdAndStatus(driverId, TripStatus.COMPLETED);
        return trips.stream().map(t -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", "TRIP-" + driverId + "-" + String.format("%03d", t.getId()));
            m.put("date", t.getCreatedAt() != null ? t.getCreatedAt().toLocalDate().toString() : "");
            m.put("time", t.getCreatedAt() != null ? t.getCreatedAt().toLocalTime().toString().substring(0,5) : "");
            m.put("from", t.getPickupAddress());
            m.put("to", t.getDropoffAddress());
            m.put("passenger", t.getPassenger() != null ? t.getPassenger().getFullName() : "Passenger");
            m.put("fare", "LKR " + (t.getTotalFare() != null ? Math.round(t.getTotalFare()) : 0));
            m.put("fareAmount", t.getTotalFare() != null ? t.getTotalFare() : 0.0);
            m.put("km", t.getDistanceKm() != null ? String.valueOf(Math.round(t.getDistanceKm() * 10.0) / 10.0) : "0");
            m.put("status", t.getStatus() != null ? t.getStatus().name().toLowerCase() : "unknown");
            double commission = t.getPlatformCommission() != null ? t.getPlatformCommission() : 0.0;
            m.put("commission", "LKR " + Math.round(commission));
            return m;
        }).toList();
    }

    // ─── Haversine Distance Formula ───────────────────────────────────────────

    /**
     * Calculates the great-circle distance between two lat/lng points in kilometres.
     *
     * Formula: a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
     *          c = 2·atan2(√a, √(1−a))
     *          d = R·c   (R = 6371 km, Earth's mean radius)
     *
     * This is a server-side Haversine mockup — in production replace with
     * Google Maps Distance Matrix API or OSRM for road distance.
     *
     * @param lat1 pickup latitude
     * @param lng1 pickup longitude
     * @param lat2 dropoff latitude
     * @param lng2 dropoff longitude
     * @return distance in kilometres
     */
    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0; // Earth radius in km

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private double[] getFareRates(String rideType) {
        double[] rates = FARE_CONFIG.get(rideType.toLowerCase());
        if (rates == null) {
            throw new IllegalArgumentException("Unknown ride type: " + rideType +
                    ". Valid types: standard, xl, moto");
        }
        return rates;
    }
}
