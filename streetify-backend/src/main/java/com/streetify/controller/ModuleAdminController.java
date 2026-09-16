package com.streetify.controller;

import com.streetify.dao.*;
import com.streetify.entity.*;
import com.streetify.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ModuleAdminController — Role-scoped CRUD endpoints for each team member's module.
 *
 * Each set of endpoints corresponds to one team member's function:
 *   Lahiru   (USER_MGMT)    → /api/module-admin/users/**
 *   Chanuka  (BOOKING_MGMT) → /api/module-admin/bookings/**
 *   Tharindu (DRIVER_MGMT)  → /api/module-admin/driver-trips/**
 *   Daham    (PAYMENT_MGMT) → /api/module-admin/payments/**
 *   Mithun   (REVIEW_MGMT)  → /api/module-admin/reviews/**
 *   Vidura   (SUPER_ADMIN)  → access to all of the above
 *
 * All routes require ADMIN role. Frontend enforces panel visibility per adminRole.
 */
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

    public ModuleAdminController(UserDAO userDAO,
                                 PassengerDAO passengerDAO,
                                 DriverDAO driverDAO,
                                 TripDAO tripDAO,
                                 PaymentDAO paymentDAO,
                                 ReviewDAO reviewDAO,
                                 JwtUtil jwtUtil) {
        this.userDAO = userDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.tripDAO = tripDAO;
        this.paymentDAO = paymentDAO;
        this.reviewDAO = reviewDAO;
        this.jwtUtil = jwtUtil;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  👤 USER MANAGEMENT — Lahiru (IT25102208)
    //  CRUD: List, View, Update, Deactivate (soft-delete) users
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/module-admin/users — List all users (passengers + drivers) */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userDAO.findAll());
    }

    /** GET /api/module-admin/users/{id} — Get single user by ID */
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userDAO.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/module-admin/users/{id} — Update user name, phone, active status */
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @RequestBody Map<String, Object> updates) {
        User user = userDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (updates.containsKey("firstName"))  user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName"))   user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("phone"))      user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("active"))     user.setActive((Boolean) updates.get("active"));

        return ResponseEntity.ok(userDAO.save(user));
    }

    /** DELETE /api/module-admin/users/{id} — Soft-deactivate a user (sets active=false) */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long id) {
        User user = userDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setActive(false);
        userDAO.save(user);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "User " + id + " deactivated."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  🗺️ BOOKING MANAGEMENT — Chanuka (IT25102207)
    //  CRUD: List, View, Update status, Cancel trip
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/module-admin/bookings — List all trips */
    @GetMapping("/bookings")
    public ResponseEntity<List<Trip>> getAllBookings() {
        return ResponseEntity.ok(tripDAO.findAll());
    }

    /** GET /api/module-admin/bookings/{id} — Get trip details */
    @GetMapping("/bookings/{id}")
    public ResponseEntity<Trip> getBooking(@PathVariable Long id) {
        return tripDAO.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/module-admin/bookings/{id} — Update trip status or addresses */
    @PutMapping("/bookings/{id}")
    public ResponseEntity<Trip> updateBooking(@PathVariable Long id,
                                              @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("status")) {
            try {
                trip.setStatus(TripStatus.valueOf((String) updates.get("status")));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status value: " + updates.get("status"));
            }
        }
        if (updates.containsKey("pickupAddress"))  trip.setPickupAddress((String) updates.get("pickupAddress"));
        if (updates.containsKey("dropoffAddress")) trip.setDropoffAddress((String) updates.get("dropoffAddress"));
        if (updates.containsKey("estimatedFare")) {
            trip.setTotalFare(((Number) updates.get("estimatedFare")).doubleValue());
        }

        return ResponseEntity.ok(tripDAO.save(trip));
    }

    /** DELETE /api/module-admin/bookings/{id} — Cancel a trip (sets status to CANCELLED) */
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        trip.setStatus(TripStatus.CANCELLED);
        tripDAO.save(trip);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Trip " + id + " cancelled."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  🚗 DRIVER TRIP MANAGEMENT — Tharindu (IT25102241)
    //  CRUD: List driver trips, assign driver, update status, view driver info
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/module-admin/driver-trips — All trips with driver assignment info */
    @GetMapping("/driver-trips")
    public ResponseEntity<List<Trip>> getAllDriverTrips() {
        return ResponseEntity.ok(tripDAO.findAll());
    }

    /** GET /api/module-admin/driver-trips/{id} — Single trip with driver info */
    @GetMapping("/driver-trips/{id}")
    public ResponseEntity<Trip> getDriverTrip(@PathVariable Long id) {
        return tripDAO.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/module-admin/drivers — All registered drivers */
    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverDAO.findAll());
    }

    /** PUT /api/module-admin/driver-trips/{id} — Assign a driver or update trip status */
    @PutMapping("/driver-trips/{id}")
    public ResponseEntity<Trip> updateDriverTrip(@PathVariable Long id,
                                                 @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("driverId")) {
            Long driverId = ((Number) updates.get("driverId")).longValue();
            Driver driver = driverDAO.findById(driverId)
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));
            trip.setDriver(driver);
        }
        if (updates.containsKey("status")) {
            trip.setStatus(TripStatus.valueOf((String) updates.get("status")));
        }

        return ResponseEntity.ok(tripDAO.save(trip));
    }

    /** DELETE /api/module-admin/driver-trips/{id} — Unassign driver from trip */
    @DeleteMapping("/driver-trips/{id}")
    public ResponseEntity<Map<String, String>> unassignDriver(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        trip.setDriver(null);
        trip.setStatus(TripStatus.REQUESTED);
        tripDAO.save(trip);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Driver unassigned from trip " + id));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  💳 PAYMENT MANAGEMENT — Daham (IT25102225)
    //  CRUD: List payments, view receipt, update status, void payment
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/module-admin/payments — All payments */
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

    /** GET /api/module-admin/payments/{id} — Single payment receipt */
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

    /** PUT /api/module-admin/payments/{id} — Update payment status or method */
    @PutMapping("/payments/{id}")
    public ResponseEntity<Map<String, Object>> updatePayment(@PathVariable Long id,
                                                              @RequestBody Map<String, Object> updates) {
        Payment p = paymentDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));

        if (updates.containsKey("status")) {
            p.setStatus(PaymentStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("paymentMethod")) {
            p.setPaymentMethod((String) updates.get("paymentMethod"));
        }
        paymentDAO.save(p);
        return ResponseEntity.ok(Map.<String, Object>of("status", "ok", "message", "Payment " + id + " updated."));
    }

    /** DELETE /api/module-admin/payments/{id} — Void a payment (set status FAILED) */
    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Map<String, String>> voidPayment(@PathVariable Long id) {
        Payment p = paymentDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));
        p.setStatus(PaymentStatus.FAILED);
        p.setFailureReason("Voided by admin");
        paymentDAO.save(p);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment " + id + " voided."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  ⭐ REVIEW MANAGEMENT — Mithun (IT25102193)
    //  CRUD: List reviews, view single, update comment/rating, delete review
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/module-admin/reviews — All reviews */
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

    /** GET /api/module-admin/reviews/{id} — Single review */
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

    /** PUT /api/module-admin/reviews/{id} — Update review rating or comment */
    @PutMapping("/reviews/{id}")
    public ResponseEntity<Map<String, String>> updateReview(@PathVariable Long id,
                                                             @RequestBody Map<String, Object> updates) {
        Review r = reviewDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));
        if (updates.containsKey("rating"))  r.setRating((Integer) updates.get("rating"));
        if (updates.containsKey("comment")) r.setComment((String) updates.get("comment"));
        reviewDAO.save(r);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Review " + id + " updated."));
    }

    /** DELETE /api/module-admin/reviews/{id} — Delete a review permanently */
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable Long id) {
        if (!reviewDAO.existsById(id)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }
        reviewDAO.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Review " + id + " deleted."));
    }
}
