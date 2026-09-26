package com.streetify.controller;

import com.streetify.dao.*;
import com.streetify.entity.*;
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
@SuppressWarnings("null")
public class ModuleAdminController {

    private final UserDAO userDAO;
    private final PassengerDAO passengerDAO;
    private final DriverDAO driverDAO;
    private final TripDAO tripDAO;
    private final PaymentDAO paymentDAO;
    private final ReviewDAO reviewDAO;
    private final AuditLogDAO auditLogDAO;
    private final DisputeDAO disputeDAO;
    private final AdminGovernanceService adminGovernanceService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.streetify.service.DispatchService dispatchService;

    public ModuleAdminController(UserDAO userDAO,
                                 PassengerDAO passengerDAO,
                                 DriverDAO driverDAO,
                                 TripDAO tripDAO,
                                 PaymentDAO paymentDAO,
                                 ReviewDAO reviewDAO,
                                 AuditLogDAO auditLogDAO,
                                 DisputeDAO disputeDAO,
                                 AdminGovernanceService adminGovernanceService,
                                 org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                                 com.streetify.service.DispatchService dispatchService) {
        this.userDAO = userDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.tripDAO = tripDAO;
        this.paymentDAO = paymentDAO;
        this.reviewDAO = reviewDAO;
        this.auditLogDAO = auditLogDAO;
        this.disputeDAO = disputeDAO;
        this.adminGovernanceService = adminGovernanceService;
        this.passwordEncoder = passwordEncoder;
        this.dispatchService = dispatchService;
    }

    private void logAdminAction(String action, String desc, Long targetId, String targetType) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userDAO.findByEmail(email).orElse(null);
        Long adminId = admin != null ? admin.getId() : 0L;
        adminGovernanceService.writeAuditLog(adminId, email, action, desc, targetId, targetType, targetId);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  📊 PLATFORM ANALYTICS & KPIS
    // ═══════════════════════════════════════════════════════════════════════════════

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPlatformStats() {
        long totalUsers = userDAO.count();
        long totalDrivers = driverDAO.count();
        long totalTrips = tripDAO.count();
        Double totalRevenue = paymentDAO.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getGrossAmount)
                .sum();
        long openDisputes = disputeDAO.countOpenDisputes();

        return ResponseEntity.ok(Map.of(
            "totalUsers", totalUsers,
            "totalDrivers", totalDrivers,
            "totalTrips", totalTrips,
            "totalRevenue", totalRevenue,
            "openDisputes", openDisputes
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  👤 USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> data) {
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
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> result = userDAO.findAll().stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone() != null ? u.getPhone() : "");
            map.put("role", u.getRole().name());
            map.put("adminRole", u.getAdminRole());
            map.put("active", u.isActive());
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        return userDAO.findById(id).map(u -> ResponseEntity.ok(Map.<String, Object>of(
            "id", u.getId(),
            "firstName", u.getFirstName(),
            "lastName", u.getLastName(),
            "email", u.getEmail(),
            "phone", u.getPhone() != null ? u.getPhone() : "",
            "role", u.getRole().name(),
            "active", u.isActive()
        ))).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (updates.containsKey("firstName"))  user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName"))   user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("phone"))      user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("active"))     user.setActive((Boolean) updates.get("active"));
        if (updates.containsKey("adminRole"))  user.setAdminRole((String) updates.get("adminRole"));

        User saved = userDAO.save(user);
        logAdminAction("UPDATE_USER", "Updated user details (including roles) for ID " + id, id, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
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
    public ResponseEntity<Map<String, Object>> createBooking(@RequestBody Map<String, Object> data) {
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
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> getAllBookings() {
        List<Map<String, Object>> result = tripDAO.findAll().stream().map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("pickupAddress", t.getPickupAddress());
            map.put("dropoffAddress", t.getDropoffAddress());
            map.put("status", t.getStatus().name());
            map.put("totalFare", t.getTotalFare());
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> getBooking(@PathVariable Long id) {
        return tripDAO.findById(id).map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("pickupAddress", t.getPickupAddress());
            map.put("dropoffAddress", t.getDropoffAddress());
            map.put("status", t.getStatus().name());
            map.put("totalFare", t.getTotalFare());
            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> updateBooking(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
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
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
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
    public ResponseEntity<List<Map<String, Object>>> getAllDriverTrips() {
        List<Map<String, Object>> result = tripDAO.findAll().stream().map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("status", t.getStatus().name());
            if (t.getDriver() != null) {
                map.put("driver", Map.of(
                    "id", t.getDriver().getId(),
                    "firstName", t.getDriver().getFirstName(),
                    "lastName", t.getDriver().getLastName()
                ));
            } else {
                map.put("driver", null);
            }
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/driver-trips/{id}")
    public ResponseEntity<Map<String, Object>> getDriverTrip(@PathVariable Long id) {
        return tripDAO.findById(id).map(t -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", t.getId());
            map.put("status", t.getStatus().name());
            if (t.getDriver() != null) {
                map.put("driver", Map.of(
                    "id", t.getDriver().getId(),
                    "firstName", t.getDriver().getFirstName(),
                    "lastName", t.getDriver().getLastName()
                ));
            } else {
                map.put("driver", null);
            }
            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getAllDrivers() {
        List<Map<String, Object>> result = driverDAO.findAll().stream().map(d -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", d.getId());
            map.put("firstName", d.getFirstName());
            map.put("lastName", d.getLastName());
            map.put("email", d.getEmail());
            map.put("phone", d.getPhone() != null ? d.getPhone() : "");
            map.put("active", d.isActive());
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }
    @PostMapping("/drivers")
    public ResponseEntity<Map<String, Object>> createDriver(@RequestBody Map<String, Object> data) {
        Driver d = new Driver();
        if (data.containsKey("firstName")) d.setFirstName((String) data.get("firstName"));
        if (data.containsKey("lastName"))  d.setLastName((String) data.get("lastName"));
        if (data.containsKey("email"))     d.setEmail((String) data.get("email"));
        if (data.containsKey("phone"))     d.setPhone((String) data.get("phone"));
        d.setPasswordHash("default-hash");
        d.setRole(UserRole.DRIVER);
        d.setActive(true);
        d.setVerificationStatus(DriverVerificationStatus.APPROVED);
        Driver saved = driverDAO.save(d);
        
        logAdminAction("CREATE_DRIVER", "Created new driver: " + saved.getEmail(), saved.getId(), "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }
    @PostMapping("/driver-trips")
    public ResponseEntity<Map<String, Object>> createDriverTrip(@RequestBody Map<String, Object> data) {
        Trip trip = new Trip();
        Passenger p = passengerDAO.findAll().stream().findFirst().orElse(null);
        trip.setPassenger(p);

        trip.setPickupLat(6.9271); trip.setPickupLng(79.8612);
        trip.setDropoffLat(6.8649); trip.setDropoffLng(79.8997);
        if (data.containsKey("pickupAddress")) trip.setPickupAddress((String) data.get("pickupAddress"));
        else trip.setPickupAddress("Dummy Pickup Address");
        
        if (data.containsKey("dropoffAddress")) trip.setDropoffAddress((String) data.get("dropoffAddress"));
        else trip.setDropoffAddress("Dummy Dropoff Address");

        trip.setRideType("CAR");
        trip.setStatus(TripStatus.REQUESTED);

        if (data.containsKey("driverId") && data.get("driverId") != null) {
            Long driverId = ((Number) data.get("driverId")).longValue();
            Driver driver = driverDAO.findById(driverId)
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));
            trip.setDriver(driver);
            trip.setStatus(TripStatus.ACCEPTED);
        }

        Trip saved = tripDAO.save(trip);
        logAdminAction("CREATE_DRIVER_TRIP", "Created dummy trip ID " + saved.getId(), saved.getId(), "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }

    @PutMapping("/driver-trips/{id}")
    public ResponseEntity<Map<String, Object>> updateDriverTrip(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("driverId")) {
            Object driverIdObj = updates.get("driverId");
            if (driverIdObj == null) {
                trip.setDriver(null);
                trip.setStatus(TripStatus.REQUESTED);
                logAdminAction("UNASSIGN_DRIVER", "Unassigned driver from trip ID " + id, id, "TRIP");
            } else {
                Long driverId = ((Number) driverIdObj).longValue();
                Driver driver = driverDAO.findById(driverId)
                        .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));
                trip.setDriver(driver);
                trip.setStatus(TripStatus.ACCEPTED);
                logAdminAction("ASSIGN_DRIVER", "Assigned driver ID " + driverId + " to trip ID " + id, id, "TRIP");
            }
        }
        if (updates.containsKey("pickupAddress")) {
            trip.setPickupAddress((String) updates.get("pickupAddress"));
            logAdminAction("UPDATE_TRIP", "Updated pickup address for trip ID " + id, id, "TRIP");
        }
        if (updates.containsKey("dropoffAddress")) {
            trip.setDropoffAddress((String) updates.get("dropoffAddress"));
            logAdminAction("UPDATE_TRIP", "Updated dropoff address for trip ID " + id, id, "TRIP");
        }
        if (updates.containsKey("status")) {
            trip.setStatus(TripStatus.valueOf((String) updates.get("status")));
            logAdminAction("UPDATE_TRIP_STATUS", "Updated trip ID " + id + " status to " + trip.getStatus(), id, "TRIP");
        }

        tripDAO.save(trip);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @DeleteMapping("/driver-trips/{id}")
    public ResponseEntity<Map<String, String>> deleteDriverTrip(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        tripDAO.delete(trip);
        
        logAdminAction("DELETE_DRIVER_TRIP", "Deleted driver trip ID " + id, id, "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Trip " + id + " deleted"));
    }

    // Driver Verification Endpoints
    @PostMapping("/driver-docs")
    public ResponseEntity<Map<String, String>> addPendingVerification(@RequestBody Map<String, Object> data) {
        Long driverId = ((Number) data.get("driverId")).longValue();
        Driver driver = driverDAO.findById(driverId).orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));
        driver.setVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION);
        if (data.containsKey("nic")) driver.setNic((String) data.get("nic"));
        if (data.containsKey("license")) driver.setLicenseNumber((String) data.get("license"));
        driverDAO.save(driver);
        
        logAdminAction("ADD_PENDING_VERIFICATION", "Set driver ID " + driverId + " to pending verification", driverId, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Driver set to pending verification."));
    }

    @GetMapping("/driver-docs")
    public ResponseEntity<List<Map<String, Object>>> getPendingDriverDocs() {
        List<Map<String, Object>> result = driverDAO.findByVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION)
            .stream().map(d -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", d.getId());
                map.put("firstName", d.getFirstName());
                map.put("lastName", d.getLastName());
                map.put("email", d.getEmail());
                map.put("phone", d.getPhone());
                map.put("nic", d.getNic() != null ? d.getNic() : "");
                map.put("licenseNumber", d.getLicenseNumber() != null ? d.getLicenseNumber() : "");
                if (d.getVehicle() != null) {
                    Map<String, Object> vMap = new java.util.HashMap<>();
                    vMap.put("make", d.getVehicle().getMake());
                    vMap.put("model", d.getVehicle().getModel());
                    vMap.put("year", d.getVehicle().getYearOfManufacture());
                    vMap.put("color", d.getVehicle().getColor());
                    vMap.put("plate", d.getVehicle().getNumberPlate());
                    vMap.put("type", d.getVehicle().getVehicleType());
                    map.put("vehicle", vMap);
                } else {
                    map.put("vehicle", null);
                }
                return map;
            }).toList();
        return ResponseEntity.ok(result);
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
        Trip t = null;
        if (data.containsKey("tripId") && data.get("tripId") != null) {
            Long tripId = ((Number) data.get("tripId")).longValue();
            t = tripDAO.findById(tripId).orElse(null);
        }
        
        if (t == null) {
            // Fallback to the first available trip that DOES NOT already have a payment
            List<Long> usedTripIds = paymentDAO.findAll().stream().map(payment -> payment.getTrip().getId()).toList();
            t = tripDAO.findAll().stream()
                .filter(trip -> !usedTripIds.contains(trip.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("All existing trips already have payments! Please create a new Trip first before adding a payment."));
        }

        Payment p = new Payment();
        p.setTrip(t);
        if (t.getPassenger() != null) p.setPassenger(t.getPassenger());
        if (t.getDriver() != null) p.setDriver(t.getDriver());

        Double gross = 0.0;
        if (data.containsKey("grossAmount")) gross = ((Number) data.get("grossAmount")).doubleValue();
        p.setGrossAmount(gross);
        p.setPlatformCommission(gross * 0.1);
        p.setDriverNet(gross * 0.9);

        if (data.containsKey("paymentMethod")) p.setPaymentMethod((String) data.get("paymentMethod"));
        else p.setPaymentMethod("CASH");
        
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
        if (updates.containsKey("grossAmount")) {
            p.setGrossAmount(((Number) updates.get("grossAmount")).doubleValue());
        }
        if (updates.containsKey("platformCommission")) {
            p.setPlatformCommission(((Number) updates.get("platformCommission")).doubleValue());
        }
        if (updates.containsKey("driverNet")) {
            p.setDriverNet(((Number) updates.get("driverNet")).doubleValue());
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
        Trip t = null;
        if (data.containsKey("tripId") && data.get("tripId") != null) {
            Long tripId = ((Number) data.get("tripId")).longValue();
            t = tripDAO.findById(tripId).orElse(null);
        }
        
        if (t == null) {
            // Fallback to a trip that does not already have a review
            List<Long> usedTripIds = reviewDAO.findAll().stream().map(r -> r.getTrip().getId()).toList();
            t = tripDAO.findAll().stream()
                .filter(trip -> !usedTripIds.contains(trip.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("All existing trips already have reviews! Please create a new Trip first."));
        }

        Review r = new Review();
        r.setTrip(t);
        if (t.getPassenger() != null) r.setPassenger(t.getPassenger());
        if (t.getDriver() != null) r.setDriver(t.getDriver());

        if (data.containsKey("rating"))  r.setRating(Integer.valueOf(data.get("rating").toString()));
        else r.setRating(5); // fallback rating
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

    @PostMapping("/audit")
    public ResponseEntity<Map<String, String>> createAuditLog(@RequestBody Map<String, Object> data) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userDAO.findByEmail(email).orElse(null);
        Long adminId = admin != null ? admin.getId() : 0L;

        String desc = data.containsKey("description") ? (String) data.get("description") : "Manual Audit Entry";
        String type = data.containsKey("actionType") ? (String) data.get("actionType") : "MANUAL_ENTRY";
        
        AuditLog log = new AuditLog();
        log.setPerformedByStaffId(adminId);
        log.setPerformedByEmail(email);
        log.setActionType(type);
        log.setDescription(desc);
        
        AuditLog saved = auditLogDAO.save(log);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Audit log " + saved.getId() + " created."));
    }

    @PutMapping("/audit/{id}")
    public ResponseEntity<Map<String, String>> updateAuditLog(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        AuditLog log = auditLogDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Audit log not found: " + id));
        if (data.containsKey("description")) {
            log.setDescription((String) data.get("description"));
        }
        if (data.containsKey("actionType")) {
            log.setActionType((String) data.get("actionType"));
        }
        auditLogDAO.save(log);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Audit log " + id + " updated."));
    }

    @DeleteMapping("/audit/{id}")
    public ResponseEntity<Map<String, String>> deleteAuditLog(@PathVariable Long id) {
        if (!auditLogDAO.existsById(id)) {
            throw new IllegalArgumentException("Audit log not found: " + id);
        }
        auditLogDAO.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Audit log " + id + " deleted."));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  🏢 BRANCH WALK-IN OFFICE KIOSK & COUNTER BOOKING MODULE
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Search passengers by phone number, email, or name for quick walk-in counter lookup.
     */
    @GetMapping("/branch/passengers/search")
    public ResponseEntity<List<Map<String, Object>>> searchBranchPassengers(@RequestParam(value = "query", defaultValue = "") String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        List<User> users = userDAO.searchPassengers(query.trim());
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("fullName", u.getFullName());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("phone", u.getPhone());
            map.put("email", u.getEmail());
            map.put("walletBalance", u.getWalletBalance());
            map.put("active", u.isActive());
            map.put("suspended", u.isSuspended());
            if (u instanceof Passenger p) {
                map.put("averageRating", p.getAverageRating());
                map.put("totalTrips", p.getTotalTrips());
            } else {
                map.put("averageRating", 5.0);
                map.put("totalTrips", 0);
            }
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * Fast in-office customer registration for walk-in commuters without a pre-existing account.
     */
    @PostMapping("/branch/passengers/quick-register")
    public ResponseEntity<Map<String, Object>> quickRegisterWalkInPassenger(@RequestBody Map<String, String> data) {
        String firstName = data.getOrDefault("firstName", "").trim();
        String lastName = data.getOrDefault("lastName", "").trim();
        String phone = data.getOrDefault("phone", "").trim();
        String email = data.getOrDefault("email", "").trim();

        if (firstName.isEmpty() || phone.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "First Name and Contact Phone are required."));
        }

        // Auto-generate unique email if walk-in passenger doesn't have an email
        if (email.isEmpty()) {
            email = "walkin." + phone.replaceAll("[^0-9]", "") + "@streetify.lk";
        }

        if (userDAO.existsByEmail(email)) {
            User existing = userDAO.findByEmail(email).orElse(null);
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("status", "exists");
            m.put("message", "Passenger already registered.");
            m.put("id", existing != null ? existing.getId() : 0);
            m.put("fullName", existing != null ? existing.getFullName() : "");
            m.put("phone", existing != null ? existing.getPhone() : phone);
            m.put("email", email);
            m.put("walletBalance", existing != null ? existing.getWalletBalance() : 0.0);
            return ResponseEntity.ok(m);
        }

        Passenger passenger = new Passenger();
        passenger.setFirstName(firstName);
        passenger.setLastName(lastName.isEmpty() ? "Commuter" : lastName);
        passenger.setPhone(phone);
        passenger.setEmail(email);
        passenger.setPasswordHash(passwordEncoder.encode("streetify123"));
        passenger.setRole(UserRole.PASSENGER);
        passenger.setActive(true);
        passenger.setSuspended(false);
        passenger.setWalletBalance(0.0);
        passenger.setAverageRating(5.0);
        passenger.setTotalTrips(0);

        Passenger saved = passengerDAO.save(passenger);
        logAdminAction("BRANCH_WALKIN_REGISTER", "Registered walk-in passenger: " + saved.getFullName() + " (" + phone + ")", saved.getId(), "PASSENGER");

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("status", "created");
        resp.put("id", saved.getId());
        resp.put("fullName", saved.getFullName());
        resp.put("firstName", saved.getFirstName());
        resp.put("lastName", saved.getLastName());
        resp.put("phone", saved.getPhone());
        resp.put("email", saved.getEmail());
        resp.put("walletBalance", saved.getWalletBalance());
        resp.put("message", "Walk-in passenger successfully registered.");
        return ResponseEntity.ok(resp);
    }

    /**
     * In-office walk-in ride booking & dispatch console.
     */
    @PostMapping("/branch/book")
    public ResponseEntity<Map<String, Object>> bookBranchWalkInTrip(@RequestBody Map<String, Object> data) {
        Long passengerId = Long.valueOf(data.get("passengerId").toString());
        Passenger passenger = passengerDAO.findById(passengerId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found: " + passengerId));

        String pickup = (String) data.getOrDefault("pickupAddress", "Streetify Central Branch — Fort Station");
        Double pickupLat = Double.valueOf(data.getOrDefault("pickupLat", 6.9344).toString());
        Double pickupLng = Double.valueOf(data.getOrDefault("pickupLng", 79.8428).toString());

        String dropoff = (String) data.getOrDefault("dropoffAddress", "Colombo City Center");
        Double dropoffLat = Double.valueOf(data.getOrDefault("dropoffLat", 6.9150).toString());
        Double dropoffLng = Double.valueOf(data.getOrDefault("dropoffLng", 79.8580).toString());

        String rideType = (String) data.getOrDefault("rideType", "CAR");
        String paymentMethod = (String) data.getOrDefault("paymentMethod", "CASH_COUNTER");
        String branchName = (String) data.getOrDefault("branchName", "Streetify Colombo Central Hub");
        String counterAgent = SecurityContextHolder.getContext().getAuthentication().getName();

        // Calculate distance and fare
        double distanceKm = Math.max(1.5, Math.round(dispatchService.estimateFare(
            com.streetify.dto.TripRequestDTO.builder()
                .pickupLat(pickupLat).pickupLng(pickupLng)
                .dropoffLat(dropoffLat).dropoffLng(dropoffLng)
                .rideType(rideType)
                .build()
        ).getDistanceKm() * 10.0) / 10.0);

        double baseFare = rideType.equalsIgnoreCase("TUK") ? 75.0 : rideType.equalsIgnoreCase("VAN") ? 280.0 : 120.0;
        double perKmRate = rideType.equalsIgnoreCase("TUK") ? 65.0 : rideType.equalsIgnoreCase("VAN") ? 140.0 : 85.0;
        double totalFare = Math.round(baseFare + (distanceKm * perKmRate) + 4.0);
        double platformCommission = Math.round(totalFare * 0.15 * 100.0) / 100.0;
        double driverNet = Math.round(totalFare * 0.85 * 100.0) / 100.0;

        // Auto-assign available driver or prioritize standby fleet
        Driver assignedDriver = null;
        if (data.containsKey("driverId") && data.get("driverId") != null && !data.get("driverId").toString().isEmpty()) {
            Long driverId = Long.valueOf(data.get("driverId").toString());
            assignedDriver = driverDAO.findById(driverId).orElse(null);
        }
        if (assignedDriver == null) {
            List<Driver> activeDrivers = driverDAO.findAll().stream()
                    .filter(d -> d.isActive() && !d.isSuspended())
                    .toList();
            if (!activeDrivers.isEmpty()) {
                assignedDriver = activeDrivers.get(0);
            }
        }

        Trip trip = new Trip();
        trip.setPassenger(passenger);
        trip.setPickupAddress(pickup);
        trip.setPickupLat(pickupLat);
        trip.setPickupLng(pickupLng);
        trip.setDropoffAddress(dropoff);
        trip.setDropoffLat(dropoffLat);
        trip.setDropoffLng(dropoffLng);
        trip.setRideType(rideType);
        trip.setDistanceKm(distanceKm);
        trip.setBaseFare(baseFare);
        trip.setPerKmRate(perKmRate);
        trip.setPlatformFee(4.0);
        trip.setTotalFare(totalFare);
        trip.setPlatformCommission(platformCommission);
        trip.setDriverNet(driverNet);
        trip.setPaymentMethod(paymentMethod);

        if (paymentMethod.equals("CASH_COUNTER") || paymentMethod.equals("CARD_COUNTER")) {
            trip.setPaid(true);
        } else if (paymentMethod.equals("WALLET")) {
            if (passenger.getWalletBalance() >= totalFare) {
                passenger.setWalletBalance(passenger.getWalletBalance() - totalFare);
                passengerDAO.save(passenger);
                trip.setPaid(true);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient wallet balance (LKR " + passenger.getWalletBalance() + "). Please collect cash at counter."));
            }
        }

        if (assignedDriver != null) {
            trip.setDriver(assignedDriver);
            trip.setStatus(TripStatus.ACCEPTED);
            trip.setAcceptedAt(java.time.LocalDateTime.now());
        } else {
            trip.setStatus(TripStatus.REQUESTED);
        }

        Trip savedTrip = tripDAO.save(trip);

        // Record counter payment into Payment ledger
        Payment payment = new Payment();
        payment.setTrip(savedTrip);
        payment.setPassenger(passenger);
        payment.setDriver(assignedDriver);
        payment.setGrossAmount(totalFare);
        payment.setPlatformCommission(platformCommission);
        payment.setDriverNet(driverNet);
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentDAO.save(payment);

        logAdminAction("BRANCH_WALKIN_BOOK", "Walk-in ride booked for " + passenger.getFullName() + " (Trip #" + savedTrip.getId() + " - LKR " + totalFare + ")", savedTrip.getId(), "TRIP");

        // Format boarding pass response
        String bookingRef = "ST-BRN-" + String.format("%05d", savedTrip.getId());
        String boardingPin = String.valueOf(1000 + (savedTrip.getId() % 9000));

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("tripId", savedTrip.getId());
        resp.put("bookingRef", bookingRef);
        resp.put("boardingPin", boardingPin);
        resp.put("status", savedTrip.getStatus().name());
        resp.put("passengerName", passenger.getFullName());
        resp.put("passengerPhone", passenger.getPhone());
        resp.put("pickupAddress", pickup);
        resp.put("dropoffAddress", dropoff);
        resp.put("rideType", rideType);
        resp.put("distanceKm", distanceKm);
        resp.put("totalFare", totalFare);
        resp.put("paymentMethod", paymentMethod);
        resp.put("isPaid", savedTrip.isPaid());
        resp.put("branchName", branchName);
        resp.put("counterAgent", counterAgent);
        resp.put("issuedAt", java.time.LocalDateTime.now().toString());

        if (assignedDriver != null) {
            resp.put("driverId", assignedDriver.getId());
            resp.put("driverName", assignedDriver.getFullName());
            resp.put("driverPhone", assignedDriver.getPhone());
            resp.put("driverRating", assignedDriver.getAverageRating());
            resp.put("vehiclePlate", assignedDriver.getVehicle() != null ? assignedDriver.getVehicle().getNumberPlate() : "CAB-1234");
            resp.put("vehicleModel", assignedDriver.getVehicle() != null ? assignedDriver.getVehicle().getModel() : "Toyota Prius");
            resp.put("pickupBay", "Office Terminal Bay 2");
            resp.put("etaMinutes", 3);
        } else {
            resp.put("pickupBay", "Main Street Dispatch Curb");
            resp.put("etaMinutes", 5);
        }

        return ResponseEntity.ok(resp);
    }

    /**
     * Get recent branch walk-in bookings for front desk log and receipt re-printing.
     */
    @GetMapping("/branch/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentBranchBookings() {
        List<Trip> recentTrips = tripDAO.findAll().stream()
                .filter(t -> t.getPaymentMethod() != null && t.getPaymentMethod().contains("COUNTER"))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(20)
                .toList();

        List<Map<String, Object>> list = recentTrips.stream().map(t -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("tripId", t.getId());
            m.put("bookingRef", "ST-BRN-" + String.format("%05d", t.getId()));
            m.put("passengerName", t.getPassenger() != null ? t.getPassenger().getFullName() : "Walk-in Commuter");
            m.put("passengerPhone", t.getPassenger() != null ? t.getPassenger().getPhone() : "N/A");
            m.put("pickupAddress", t.getPickupAddress());
            m.put("dropoffAddress", t.getDropoffAddress());
            m.put("rideType", t.getRideType());
            m.put("totalFare", t.getTotalFare());
            m.put("paymentMethod", t.getPaymentMethod());
            m.put("status", t.getStatus().name());
            m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
            m.put("driverName", t.getDriver() != null ? t.getDriver().getFullName() : "Searching...");
            m.put("vehiclePlate", t.getDriver() != null && t.getDriver().getVehicle() != null ? t.getDriver().getVehicle().getNumberPlate() : "N/A");
            return m;
        }).toList();

        return ResponseEntity.ok(list);
    }
}
