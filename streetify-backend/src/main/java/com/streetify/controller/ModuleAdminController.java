package com.streetify.controller;

import com.streetify.dao.*;
import com.streetify.entity.*;
import com.streetify.security.JwtUtil;
import com.streetify.service.AdminGovernanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/module-admin")
@PreAuthorize("hasRole('ADMIN')")
public class ModuleAdminController {

    private final UserDAO userDAO;
    private final PassengerDAO passengerDAO;
    private final DriverDAO driverDAO;
    private final TripDAO tripDAO;
    private final PaymentDAO paymentDAO;
    private final ReviewDAO reviewDAO;
    private final JwtUtil jwtUtil;
    private final AdminGovernanceService adminGovernanceService;

    public ModuleAdminController(UserDAO userDAO,
                                 PassengerDAO passengerDAO,
                                 DriverDAO driverDAO,
                                 TripDAO tripDAO,
                                 PaymentDAO paymentDAO,
                                 ReviewDAO reviewDAO,
                                 JwtUtil jwtUtil,
                                 AdminGovernanceService adminGovernanceService) {
        this.userDAO = userDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.tripDAO = tripDAO;
        this.paymentDAO = paymentDAO;
        this.reviewDAO = reviewDAO;
        this.jwtUtil = jwtUtil;
        this.adminGovernanceService = adminGovernanceService;
    }

    private void logAdminAction(String action, String desc, Long targetId, String targetType) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userDAO.findByEmail(email).orElse(null);
        Long adminId = admin != null ? admin.getId() : 0L;
        adminGovernanceService.writeAuditLog(adminId, email, action, desc, targetId, targetType, targetId);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  👤 USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody Map<String, Object> data) {
        User user = new User();
        if (data.containsKey("firstName")) user.setFirstName((String) data.get("firstName"));
        if (data.containsKey("lastName"))  user.setLastName((String) data.get("lastName"));
        if (data.containsKey("email"))     user.setEmail((String) data.get("email"));
        if (data.containsKey("phone"))     user.setPhone((String) data.get("phone"));
        user.setPasswordHash("default-hash");
        user.setRole(UserRole.PASSENGER);
        user.setActive(true);
        User saved = userDAO.save(user);
        
        logAdminAction("CREATE_USER", "Created new passenger user: " + user.getEmail(), saved.getId(), "USER");
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userDAO.findAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userDAO.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (updates.containsKey("firstName"))  user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName"))   user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("phone"))      user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("active"))     user.setActive((Boolean) updates.get("active"));

        User saved = userDAO.save(user);
        logAdminAction("UPDATE_USER", "Updated user details for ID " + id, id, "USER");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long id) {
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setActive(false);
        userDAO.save(user);
        
        logAdminAction("DEACTIVATE_USER", "Deactivated user ID " + id, id, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "User " + id + " deactivated."));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  🗺️ BOOKING MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/bookings")
    public ResponseEntity<Trip> createBooking(@RequestBody Map<String, Object> data) {
        Trip trip = new Trip();
        Passenger p = passengerDAO.findAll().stream().findFirst().orElse(null);
        trip.setPassenger(p);

        if (data.containsKey("pickupAddress")) trip.setPickupAddress((String) data.get("pickupAddress"));
        if (data.containsKey("dropoffAddress")) trip.setDropoffAddress((String) data.get("dropoffAddress"));
        
        trip.setPickupLat(6.9271); trip.setPickupLng(79.8612);
        trip.setDropoffLat(6.8649); trip.setDropoffLng(79.8997);
        trip.setRideType("CAR");
        trip.setStatus(TripStatus.REQUESTED);
        Trip saved = tripDAO.save(trip);
        
        logAdminAction("CREATE_BOOKING", "Created new trip manually from " + trip.getPickupAddress(), saved.getId(), "TRIP");
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Trip>> getAllBookings() {
        return ResponseEntity.ok(tripDAO.findAll());
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Trip> getBooking(@PathVariable Long id) {
        return tripDAO.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<Trip> updateBooking(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("status")) {
            trip.setStatus(TripStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("pickupAddress"))  trip.setPickupAddress((String) updates.get("pickupAddress"));
        if (updates.containsKey("dropoffAddress")) trip.setDropoffAddress((String) updates.get("dropoffAddress"));
        if (updates.containsKey("estimatedFare")) {
            trip.setTotalFare(((Number) updates.get("estimatedFare")).doubleValue());
        }

        Trip saved = tripDAO.save(trip);
        logAdminAction("UPDATE_BOOKING", "Updated booking ID " + id + " status to " + trip.getStatus(), id, "TRIP");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        trip.setStatus(TripStatus.CANCELLED);
        tripDAO.save(trip);
        
        logAdminAction("CANCEL_BOOKING", "Cancelled booking ID " + id, id, "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Trip " + id + " cancelled."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  🚗 DRIVER TRIP MANAGEMENT & VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/driver-trips")
    public ResponseEntity<List<Trip>> getAllDriverTrips() {
        return ResponseEntity.ok(tripDAO.findAll());
    }

    @GetMapping("/driver-trips/{id}")
    public ResponseEntity<Trip> getDriverTrip(@PathVariable Long id) {
        return tripDAO.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverDAO.findAll());
    }

    @PutMapping("/driver-trips/{id}")
    public ResponseEntity<Trip> updateDriverTrip(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("driverId")) {
            Long driverId = ((Number) updates.get("driverId")).longValue();
            Driver driver = driverDAO.findById(driverId)
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));
            trip.setDriver(driver);
            trip.setStatus(TripStatus.ACCEPTED);
            logAdminAction("ASSIGN_DRIVER", "Assigned driver ID " + driverId + " to trip ID " + id, id, "TRIP");
        }
        if (updates.containsKey("status")) {
            trip.setStatus(TripStatus.valueOf((String) updates.get("status")));
            logAdminAction("UPDATE_TRIP_STATUS", "Updated trip ID " + id + " status to " + trip.getStatus(), id, "TRIP");
        }

        return ResponseEntity.ok(tripDAO.save(trip));
    }

    @DeleteMapping("/driver-trips/{id}")
    public ResponseEntity<Map<String, String>> unassignDriver(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        trip.setDriver(null);
        trip.setStatus(TripStatus.REQUESTED);
        tripDAO.save(trip);
        
        logAdminAction("UNASSIGN_DRIVER", "Unassigned driver from trip ID " + id, id, "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Driver unassigned from trip " + id));
    }

    // Driver Verification Endpoints
    @GetMapping("/driver-docs")
    public ResponseEntity<List<Driver>> getPendingDriverDocs() {
        return ResponseEntity.ok(driverDAO.findByVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION));
    }

    @PutMapping("/driver-docs/{id}")
    public ResponseEntity<Map<String, String>> verifyDriverDoc(@PathVariable Long id, @RequestBody Map<String, String> data) {
        Driver driver = driverDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Driver not found: " + id));
        String action = data.getOrDefault("action", "APPROVE");
        
        if ("APPROVE".equalsIgnoreCase(action)) {
            driver.setVerificationStatus(DriverVerificationStatus.APPROVED);
            logAdminAction("APPROVE_DRIVER", "Approved verification for Driver ID " + id, id, "USER");
        } else {
            driver.setVerificationStatus(DriverVerificationStatus.REJECTED);
            logAdminAction("REJECT_DRIVER", "Rejected verification for Driver ID " + id, id, "USER");
        }
        
        driverDAO.save(driver);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Driver verification updated to " + driver.getVerificationStatus()));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  💳 PAYMENT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/payments")
    public ResponseEntity<Map<String, Object>> createPayment(@RequestBody Map<String, Object> data) {
        Payment p = new Payment();
        if (data.containsKey("grossAmount")) p.setGrossAmount(((Number) data.get("grossAmount")).doubleValue());
        if (data.containsKey("paymentMethod")) p.setPaymentMethod((String) data.get("paymentMethod"));
        p.setStatus(PaymentStatus.SUCCESS);
        p.setProcessedAt(java.time.LocalDateTime.now());
        Payment saved = paymentDAO.save(p);
        
        logAdminAction("CREATE_PAYMENT", "Created manual payment of LKR " + p.getGrossAmount(), saved.getId(), "PAYMENT");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment created."));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Map<String, Object>>> getAllPayments() {
        List<Payment> payments = paymentDAO.findAll();
        List<Map<String, Object>> result = payments.stream().map(p -> Map.<String, Object>of(
            "id",                p.getId(),
            "grossAmount",       p.getGrossAmount(),
            "platformCommission",p.getPlatformCommission(),
            "driverNet",         p.getDriverNet(),
            "paymentMethod",     p.getPaymentMethod(),
            "status",            p.getStatus().name(),
            "processedAt",       p.getProcessedAt() != null ? p.getProcessedAt().toString() : "",
            "createdAt",         p.getCreatedAt() != null ? p.getCreatedAt().toString() : "",
            "tripId",            p.getTrip() != null ? p.getTrip().getId() : null
        )).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payments/{id}")
    public ResponseEntity<Map<String, Object>> getPayment(@PathVariable Long id) {
        Payment p = paymentDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));
        return ResponseEntity.ok(Map.<String, Object>of(
            "id",                p.getId(),
            "grossAmount",       p.getGrossAmount(),
            "platformCommission",p.getPlatformCommission(),
            "driverNet",         p.getDriverNet(),
            "paymentMethod",     p.getPaymentMethod(),
            "status",            p.getStatus().name(),
            "processedAt",       p.getProcessedAt() != null ? p.getProcessedAt().toString() : "",
            "tripId",            p.getTrip() != null ? p.getTrip().getId() : null
        ));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<Map<String, Object>> updatePayment(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Payment p = paymentDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));

        if (updates.containsKey("status")) {
            p.setStatus(PaymentStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("paymentMethod")) {
            p.setPaymentMethod((String) updates.get("paymentMethod"));
        }
        paymentDAO.save(p);
        
        logAdminAction("UPDATE_PAYMENT", "Updated payment ID " + id, id, "PAYMENT");
        return ResponseEntity.ok(Map.<String, Object>of("status", "ok", "message", "Payment " + id + " updated."));
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Map<String, String>> voidPayment(@PathVariable Long id) {
        Payment p = paymentDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));
        p.setStatus(PaymentStatus.FAILED);
        p.setFailureReason("Voided by admin");
        paymentDAO.save(p);
        
        logAdminAction("VOID_PAYMENT", "Voided payment ID " + id, id, "PAYMENT");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment " + id + " voided."));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  ⭐ REVIEW MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/reviews")
    public ResponseEntity<Map<String, String>> createReview(@RequestBody Map<String, Object> data) {
        Review r = new Review();
        if (data.containsKey("rating"))  r.setRating((Integer) data.get("rating"));
        if (data.containsKey("comment")) r.setComment((String) data.get("comment"));
        Review saved = reviewDAO.save(r);
        
        logAdminAction("CREATE_REVIEW", "Created manual review rating " + r.getRating(), saved.getId(), "REVIEW");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Review created."));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Map<String, Object>>> getAllReviews() {
        List<Review> reviews = reviewDAO.findAll();
        List<Map<String, Object>> result = reviews.stream().map(r -> Map.<String, Object>of(
            "id",          r.getId(),
            "rating",      r.getRating(),
            "comment",     r.getComment() != null ? r.getComment() : "",
            "createdAt",   r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reviews/{id}")
    public ResponseEntity<Map<String, Object>> getReview(@PathVariable Long id) {
        Review r = reviewDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));
        return ResponseEntity.ok(Map.<String, Object>of(
            "id",          r.getId(),
            "rating",      r.getRating(),
            "comment",     r.getComment() != null ? r.getComment() : "",
            "createdAt",   r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""
        ));
    }

    @PutMapping("/reviews/{id}")
    public ResponseEntity<Map<String, String>> updateReview(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Review r = reviewDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));
        if (updates.containsKey("rating"))  r.setRating((Integer) updates.get("rating"));
        if (updates.containsKey("comment")) r.setComment((String) updates.get("comment"));
        reviewDAO.save(r);
        
        logAdminAction("UPDATE_REVIEW", "Updated review ID " + id, id, "REVIEW");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Review " + id + " updated."));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable Long id) {
        if (!reviewDAO.existsById(id)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }
        reviewDAO.deleteById(id);
        
        logAdminAction("DELETE_REVIEW", "Deleted review ID " + id, id, "REVIEW");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Review " + id + " deleted."));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    //  🛡️ SYSTEM CONTROL (SUPER ADMIN)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminGovernanceService.getRecentAuditLogs(100));
    }
}
