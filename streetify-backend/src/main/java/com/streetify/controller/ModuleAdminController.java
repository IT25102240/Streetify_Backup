package com.streetify.controller;

import com.streetify.dao.*;
import com.streetify.entity.*;
import com.streetify.service.AdminGovernanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

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
    private final DriverDocumentDAO driverDocumentDAO;
    private final VehicleDAO vehicleDAO;
    private final TripDAO tripDAO;
    private final PaymentDAO paymentDAO;
    private final ReviewDAO reviewDAO;
    private final AuditLogDAO auditLogDAO;
    private final DisputeDAO disputeDAO;
    private final AdminGovernanceService adminGovernanceService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.streetify.service.DispatchService dispatchService;
    private final JdbcTemplate jdbcTemplate;

    public ModuleAdminController(UserDAO userDAO,
                                 PassengerDAO passengerDAO,
                                 DriverDAO driverDAO,
                                 DriverDocumentDAO driverDocumentDAO,
                                 VehicleDAO vehicleDAO,
                                 TripDAO tripDAO,
                                 PaymentDAO paymentDAO,
                                 ReviewDAO reviewDAO,
                                 AuditLogDAO auditLogDAO,
                                 DisputeDAO disputeDAO,
                                 AdminGovernanceService adminGovernanceService,
                                 org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                                 com.streetify.service.DispatchService dispatchService,
                                 JdbcTemplate jdbcTemplate) {
        this.userDAO = userDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.driverDocumentDAO = driverDocumentDAO;
        this.vehicleDAO = vehicleDAO;
        this.tripDAO = tripDAO;
        this.paymentDAO = paymentDAO;
        this.reviewDAO = reviewDAO;
        this.auditLogDAO = auditLogDAO;
        this.disputeDAO = disputeDAO;
        this.adminGovernanceService = adminGovernanceService;
        this.passwordEncoder = passwordEncoder;
        this.dispatchService = dispatchService;
        this.jdbcTemplate = jdbcTemplate;
    }

    private void logAdminAction(String action, String desc, Long targetId, String targetType) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userDAO.findByEmail(email).orElse(null);
        Long adminId = admin != null ? admin.getId() : 0L;
        adminGovernanceService.writeAuditLog(adminId, email, action, desc, targetId, targetType, targetId);
    }

    public static boolean isValidDriverPhone(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String cleaned = phone.trim().replaceAll("[\\s\\-]", "");
        return cleaned.matches("^(\\+94\\d{9}|0\\d{9})$");
    }

    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) return false;
        String trimmed = email.trim();
        return trimmed.contains("@") && trimmed.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
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
        String roleStr = data.containsKey("role") && data.get("role") != null ? data.get("role").toString().toUpperCase() : "PASSENGER";
        UserRole role = UserRole.PASSENGER;
        try {
            role = UserRole.valueOf(roleStr);
        } catch (Exception ignored) {}

        String email = ((String) data.getOrDefault("email", "")).toLowerCase().trim();
        if (email.isEmpty() || !isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Email must be a valid email address containing the '@' symbol (e.g. user@streetify.lk)."));
        }
        if (userDAO.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "User with email '" + email + "' already exists."));
        }

        String rawPassword = data.containsKey("password") ? (String) data.get("password") : "1111";

        if (role == UserRole.DRIVER) {
            String phone = (String) data.getOrDefault("phone", "");
            if (phone == null || phone.isBlank() || !isValidDriverPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567)."
                ));
            }
            Driver driver = new Driver();
            driver.setFirstName((String) data.getOrDefault("firstName", "New"));
            driver.setLastName((String) data.getOrDefault("lastName", "Driver"));
            driver.setEmail(email);
            driver.setPhone(phone);
            driver.setNic((String) data.getOrDefault("nic", "1992" + (System.currentTimeMillis() % 10000000)));
            driver.setLicenseNumber((String) data.getOrDefault("licenseNumber", driver.getNic()));
            driver.setPasswordHash(passwordEncoder.encode(rawPassword));
            driver.setPlainPassword(rawPassword);
            driver.setRole(UserRole.DRIVER);
            driver.setVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION);
            driver.setActive(false);
            Driver savedDriver = driverDAO.save(driver);

            String plate = ((String) data.getOrDefault("numberPlate", "CAB-" + (2000 + (savedDriver.getId() % 7000)))).toUpperCase().trim();
            Vehicle vehicle = Vehicle.builder()
                .driver(savedDriver)
                .vehicleType((String) data.getOrDefault("vehicleType", "CAR"))
                .numberPlate(plate)
                .yearOfManufacture(data.containsKey("yearOfManufacture") ? ((Number) data.get("yearOfManufacture")).intValue() : 2021)
                .make((String) data.getOrDefault("make", "Toyota"))
                .model((String) data.getOrDefault("model", "Prius"))
                .color((String) data.getOrDefault("color", "White"))
                .build();
            vehicleDAO.save(vehicle);

            List<String> docTypes = List.of("license", "reg", "insurance");
            for (String dt : docTypes) {
                DriverDocument doc = new DriverDocument();
                doc.setDriver(savedDriver);
                doc.setDocType(dt);
                doc.setOriginalFilename(dt + "_" + savedDriver.getLastName().toLowerCase() + ".pdf");
                doc.setFilePath("uploads/documents/driver-" + savedDriver.getId() + "/" + dt + ".pdf");
                doc.setFileSizeBytes(1024L * 1024L);
                doc.setContentType("application/pdf");
                doc.setStatus(DocumentStatus.PENDING);
                doc.setReviewerNote("Onboarded by User Admin. Awaiting Driver Admin review.");
                driverDocumentDAO.save(doc);
            }

            logAdminAction("CREATE_DRIVER", "Created new approved Driver: " + email + " with vehicle " + plate, savedDriver.getId(), "USER");
            return ResponseEntity.ok(Map.of("status", "ok", "id", savedDriver.getId(), "role", "DRIVER"));
        } else {
            User user = new User();
            user.setFirstName((String) data.getOrDefault("firstName", "New"));
            user.setLastName((String) data.getOrDefault("lastName", "Passenger"));
            user.setEmail(email);
            user.setPhone((String) data.getOrDefault("phone", "0770000000"));
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setPlainPassword(rawPassword);
            user.setRole(role);
            if (data.containsKey("adminRole")) {
                user.setAdminRole((String) data.get("adminRole"));
            }
            user.setActive(true);
            User saved = userDAO.save(user);
            logAdminAction("CREATE_USER", "Created new " + user.getRole() + " user: " + user.getEmail(), saved.getId(), "USER");
            return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId(), "role", role.name()));
        }
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
            map.put("plainPassword", u.getPlainPassword());
            map.put("active", u.isActive());

            if (u.getRole() == UserRole.DRIVER) {
                if (u instanceof Driver d) {
                    map.put("nic", d.getNic());
                    map.put("licenseNumber", d.getLicenseNumber());
                    map.put("verificationStatus", d.getVerificationStatus() != null ? d.getVerificationStatus().name() : "APPROVED");
                }
                vehicleDAO.findByDriverId(u.getId()).ifPresent(v -> {
                    map.put("vehicleType", v.getVehicleType());
                    map.put("numberPlate", v.getNumberPlate());
                    map.put("vehicleModel", v.getModel());
                    map.put("vehicleMake", v.getMake());
                    map.put("yearOfManufacture", v.getYearOfManufacture());
                    map.put("vehicleColor", v.getColor());
                });
            }
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/summary")
    public ResponseEntity<Map<String, Object>> getUsersSummary() {
        // Purge any orphan vehicle rows from previous test downgrades
        try {
            jdbcTemplate.update("DELETE FROM vehicles WHERE driver_id NOT IN (SELECT id FROM users WHERE dtype = 'DRIVER')");
        } catch (Exception ignored) {}

        Long totalUsers = jdbcTemplate.queryForObject("SELECT count(*) FROM users", Long.class);
        Long totalPassengers = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE role = 'PASSENGER'", Long.class);
        Long totalDrivers = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE role = 'DRIVER'", Long.class);
        Long totalAdmins = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE role = 'ADMIN'", Long.class);
        Long activeUsers = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE active = 1", Long.class);
        long inactiveUsers = (totalUsers != null ? totalUsers : 0L) - (activeUsers != null ? activeUsers : 0L);

        Long verifiedDrivers = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM users WHERE role = 'DRIVER' AND verification_status = 'APPROVED'", 
            Long.class
        );

        Map<String, Long> fleetCounts = new java.util.HashMap<>();
        try {
            jdbcTemplate.query("SELECT vehicle_type, count(*) as cnt FROM vehicles WHERE driver_id IN (SELECT id FROM users WHERE dtype='DRIVER') GROUP BY vehicle_type", (rs) -> {
                fleetCounts.put(rs.getString("vehicle_type"), rs.getLong("cnt"));
            });
        } catch (Exception ignored) {}

        Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("totalUsers", totalUsers != null ? totalUsers : 0L);
        summary.put("totalPassengers", totalPassengers != null ? totalPassengers : 0L);
        summary.put("totalDrivers", totalDrivers != null ? totalDrivers : 0L);
        summary.put("totalAdmins", totalAdmins != null ? totalAdmins : 0L);
        summary.put("activeUsers", activeUsers != null ? activeUsers : 0L);
        summary.put("inactiveUsers", inactiveUsers);
        summary.put("verifiedDrivers", verifiedDrivers != null ? verifiedDrivers : 0L);
        summary.put("fleetCounts", fleetCounts);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        return userDAO.findById(id).map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone() != null ? u.getPhone() : "");
            map.put("role", u.getRole().name());
            map.put("adminRole", u.getAdminRole());
            map.put("plainPassword", u.getPlainPassword());
            map.put("active", u.isActive());

            if (u.getRole() == UserRole.DRIVER) {
                if (u instanceof Driver d) {
                    map.put("nic", d.getNic());
                    map.put("licenseNumber", d.getLicenseNumber());
                    map.put("verificationStatus", d.getVerificationStatus() != null ? d.getVerificationStatus().name() : "APPROVED");
                }
                vehicleDAO.findByDriverId(u.getId()).ifPresent(v -> {
                    map.put("vehicleType", v.getVehicleType());
                    map.put("numberPlate", v.getNumberPlate());
                    map.put("vehicleModel", v.getModel());
                    map.put("vehicleMake", v.getMake());
                    map.put("yearOfManufacture", v.getYearOfManufacture());
                    map.put("vehicleColor", v.getColor());
                });
            }
            return ResponseEntity.ok(map);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (updates.containsKey("firstName")) user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName"))  user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("email")) {
            String newEmail = updates.get("email") != null ? ((String) updates.get("email")).trim().toLowerCase() : "";
            if (newEmail.isEmpty() || !isValidEmail(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Email must be a valid email address containing the '@' symbol (e.g. user@streetify.lk)."
                ));
            }
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userDAO.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Email '" + newEmail + "' is already in use by another account."));
                }
                user.setEmail(newEmail);
            }
        }
        if (updates.containsKey("password") && updates.get("password") != null) {
            String newPassword = ((String) updates.get("password")).trim();
            if (!newPassword.isEmpty()) {
                if (newPassword.length() < 4) {
                    return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Password must be at least 4 characters long."));
                }
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                user.setPlainPassword(newPassword);
            }
        }
        if (updates.containsKey("phone")) {
            String newPhone = (String) updates.get("phone");
            if (user.getRole() == UserRole.DRIVER) {
                if (newPhone == null || newPhone.isBlank() || !isValidDriverPhone(newPhone)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567)."
                    ));
                }
            }
            user.setPhone(newPhone);
        }
        if (updates.containsKey("active"))    user.setActive((Boolean) updates.get("active"));
        if (updates.containsKey("adminRole")) user.setAdminRole((String) updates.get("adminRole"));

        User saved = userDAO.save(user);
        logAdminAction("UPDATE_USER", "Updated user profile (email/details) for ID " + id + " (" + saved.getEmail() + ")", id, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId(), "email", saved.getEmail()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deactivateUser(
            @PathVariable Long id,
            @RequestParam(value = "permanent", defaultValue = "false") boolean permanent
    ) {
        if (permanent) {
            deleteUserPermanently(id);
            return ResponseEntity.ok(Map.of("status", "ok", "message", "User " + id + " permanently deleted."));
        }
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setActive(false);
        userDAO.save(user);
        
        logAdminAction("DEACTIVATE_USER", "Deactivated user ID " + id, id, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "User " + id + " deactivated."));
    }

    @DeleteMapping("/users/{id}/permanent")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteUserPermanently(@PathVariable Long id) {
        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if ("vidura@streetify.lk".equalsIgnoreCase(user.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Cannot delete Master Super Admin account."));
        }

        if (user.getAdminRole() != null && !user.getAdminRole().isEmpty()) {
            String callerEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            User caller = userDAO.findByEmail(callerEmail).orElse(null);
            boolean isCallerMaster = caller != null && "vidura@streetify.lk".equalsIgnoreCase(caller.getEmail());
            boolean isCallerSuperAdmin = caller != null && "SUPER_ADMIN".equalsIgnoreCase(caller.getAdminRole());
            
            if ("SUPER_ADMIN".equalsIgnoreCase(user.getAdminRole())) {
                if (!isCallerMaster) {
                    return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of(
                        "status", "error", 
                        "message", "Access Denied: Only the Master Admin can delete Super Admin accounts."
                    ));
                }
            } else {
                if (!isCallerSuperAdmin && !isCallerMaster) {
                    return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of(
                        "status", "error", 
                        "message", "Access Denied: Only Super Admin can delete other admin accounts."
                    ));
                }
            }
        }

        // Clean up linked dependencies safely to prevent foreign key constraint violations
        try { vehicleDAO.findByDriverId(id).ifPresent(vehicleDAO::delete); } catch (Exception ignored) {}
        try { driverDocumentDAO.findByDriverId(id).forEach(driverDocumentDAO::delete); } catch (Exception ignored) {}
        try {
            reviewDAO.findAll().stream()
                .filter(r -> (r.getPassenger() != null && r.getPassenger().getId().equals(id)) || (r.getDriver() != null && r.getDriver().getId().equals(id)))
                .forEach(reviewDAO::delete);
        } catch (Exception ignored) {}
        try {
            paymentDAO.findAll().stream()
                .filter(p -> (p.getPassenger() != null && p.getPassenger().getId().equals(id)) || (p.getDriver() != null && p.getDriver().getId().equals(id)))
                .forEach(paymentDAO::delete);
        } catch (Exception ignored) {}
        try {
            tripDAO.findAll().stream()
                .filter(t -> (t.getPassenger() != null && t.getPassenger().getId().equals(id)) || (t.getDriver() != null && t.getDriver().getId().equals(id)))
                .forEach(tripDAO::delete);
        } catch (Exception ignored) {}
        try {
            disputeDAO.findAll().stream()
                .filter(d -> d.getPassenger() != null && d.getPassenger().getId().equals(id))
                .forEach(disputeDAO::delete);
        } catch (Exception ignored) {}
        try {
            disputeDAO.findAll().stream()
                .filter(d -> id.equals(d.getResolvedByStaffId()))
                .forEach(d -> {
                    d.setResolvedByStaffId(null);
                    disputeDAO.save(d);
                });
        } catch (Exception ignored) {}
        try {
            auditLogDAO.findAll().stream()
                .filter(a -> (a.getTargetUserId() != null && a.getTargetUserId().equals(id)) || (a.getPerformedByStaffId() != null && a.getPerformedByStaffId().equals(id)))
                .forEach(auditLogDAO::delete);
        } catch (Exception ignored) {}

        userDAO.delete(user);
        logAdminAction("DELETE_USER", "Permanently deleted user: " + user.getEmail() + " (ID: " + id + ")", id, "USER");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "User " + user.getEmail() + " permanently deleted."));
    }

    @PostMapping("/users/{id}/change-role")
    @Transactional
    public ResponseEntity<Map<String, Object>> changeUserRole(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        // Enforce that only User Admin (USER_MGMT) or Super Admin can execute role transitions
        String callerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userDAO.findByEmail(callerEmail).orElse(null);
        boolean isAuthorized = caller != null && (
            "SUPER_ADMIN".equalsIgnoreCase(caller.getAdminRole()) || 
            "USER_MGMT".equalsIgnoreCase(caller.getAdminRole()) ||
            "vidura@streetify.lk".equalsIgnoreCase(caller.getEmail())
        );
        if (!isAuthorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "status", "error", 
                "message", "Access Denied: Only User Admin (USER_MGMT) or Super Admin can change user roles."
            ));
        }

        User user = userDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        String targetRoleStr = (String) data.get("targetRole");
        if (targetRoleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "targetRole ('DRIVER' or 'PASSENGER') is required."));
        }
        UserRole targetRole = UserRole.valueOf(targetRoleStr.toUpperCase());

        if (targetRole == UserRole.DRIVER) {
            String phone = data.containsKey("phone") ? (String) data.get("phone") : user.getPhone();
            if (phone == null || phone.isBlank() || !isValidDriverPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567)."
                ));
            }
            // Passenger -> Driver: Must fulfill Personal Info, Vehicle & Security, and Documents
            String nic = (String) data.getOrDefault("nic", "1994" + (System.currentTimeMillis() % 10000000));
            String license = (String) data.getOrDefault("licenseNumber", "B" + (1000000 + (id % 9000000)));
            String vType = ((String) data.getOrDefault("vehicleType", "CAR")).toUpperCase();
            String plate = ((String) data.getOrDefault("numberPlate", "CAB-" + (3000 + id))).toUpperCase().trim();
            String make = (String) data.getOrDefault("make", "Toyota");
            String model = (String) data.getOrDefault("model", "Prius");
            String color = (String) data.getOrDefault("color", "White");
            int year = data.containsKey("yearOfManufacture") ? ((Number) data.get("yearOfManufacture")).intValue() : 2020;

            // Direct SQL update to cleanly switch SINGLE_TABLE discriminator and role, updating phone as well
            jdbcTemplate.update(
                "UPDATE users SET dtype = 'DRIVER', role = 'DRIVER', nic = ?, license_number = ?, phone = ?, verification_status = 'APPROVED', updated_at = GETDATE() WHERE id = ?",
                nic, license, phone, id
            );

            // Create or update associated Vehicle via JDBC to avoid JPA ClassCastException due to L1 cache holding a Passenger entity
            int vehicleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vehicles WHERE driver_id = ?", Integer.class, id);
            if (vehicleCount > 0) {
                jdbcTemplate.update(
                    "UPDATE vehicles SET vehicle_type = ?, number_plate = ?, make = ?, model = ?, color = ?, year_of_manufacture = ? WHERE driver_id = ?",
                    vType, plate, make, model, color, year, id
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO vehicles (driver_id, vehicle_type, number_plate, make, model, color, year_of_manufacture, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())",
                    id, vType, plate, make, model, color, year
                );
            }

            // Create or ensure required DriverDocument records in APPROVED status
            List<String> docTypes = List.of("license", "reg", "insurance");
            for (String dt : docTypes) {
                int docCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM driver_documents WHERE driver_id = ? AND doc_type = ?", Integer.class, id, dt);
                if (docCount == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO driver_documents (driver_id, doc_type, original_filename, file_path, file_size_bytes, content_type, status, reviewer_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', 'Verified and approved during role promotion by User Admin.', GETDATE(), GETDATE())",
                        id, dt, dt + "_" + user.getLastName().toLowerCase() + ".pdf", "uploads/documents/driver-" + id + "/" + dt + ".pdf", 1048576L, "application/pdf"
                    );
                }
            }

            logAdminAction("PROMOTE_TO_DRIVER", "Upgraded passenger " + user.getEmail() + " to approved DRIVER with vehicle " + plate, id, "USER");
            return ResponseEntity.ok(Map.of(
                "status", "ok", 
                "message", "User " + user.getEmail() + " successfully upgraded to Driver with vehicle " + plate
            ));

        } else if (targetRole == UserRole.PASSENGER) {
            // Driver -> Passenger: Immediate conversion
            jdbcTemplate.update(
                "UPDATE users SET dtype = 'PASSENGER', role = 'PASSENGER', is_online = 0, updated_at = GETDATE() WHERE id = ?",
                id
            );
            try {
                jdbcTemplate.update("DELETE FROM vehicles WHERE driver_id = ?", id);
            } catch (Exception ignored) {}
            logAdminAction("DEMOTE_TO_PASSENGER", "Switched driver " + user.getEmail() + " to standard PASSENGER immediately", id, "USER");
            return ResponseEntity.ok(Map.of(
                "status", "ok", 
                "message", "Driver " + user.getEmail() + " successfully changed to standard Passenger."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Unsupported target role: " + targetRole));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    //  🗺️ BOOKING MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════

    @PostMapping("/bookings")
    public ResponseEntity<Map<String, Object>> createBooking(@RequestBody Map<String, Object> data) {
        Trip trip = new Trip();
        Passenger p = passengerDAO.findAll().stream().findFirst().orElseGet(() -> {
            Passenger newP = new Passenger();
            newP.setFirstName("Walk-in");
            newP.setLastName("Passenger");
            newP.setEmail("walkin_" + System.currentTimeMillis() + "@streetify.com");
            newP.setPasswordHash(passwordEncoder.encode("1111"));
            newP.setPlainPassword("1111");
            newP.setPhone("0770000000");
            newP.setRole(UserRole.PASSENGER);
            newP.setActive(true);
            return passengerDAO.save(newP);
        });
        trip.setPassenger(p);

        String pickup = (String) data.getOrDefault("pickupAddress", "Colombo Fort Railway Station");
        String dropoff = (String) data.getOrDefault("dropoffAddress", "Nugegoda Junction");
        trip.setPickupAddress(pickup);
        trip.setDropoffAddress(dropoff);
        
        trip.setPickupLat(6.9271); trip.setPickupLng(79.8612);
        trip.setDropoffLat(6.8649); trip.setDropoffLng(79.8997);
        
        if (data.containsKey("rideType") && data.get("rideType") != null && !data.get("rideType").toString().isBlank()) {
            trip.setRideType(data.get("rideType").toString().toLowerCase());
        } else {
            trip.setRideType("standard");
        }
        
        if (data.containsKey("distanceKm") && data.get("distanceKm") != null) {
            try {
                trip.setDistanceKm(((Number) data.get("distanceKm")).doubleValue());
            } catch (Exception ex) {
                trip.setDistanceKm(8.5);
            }
        } else {
            trip.setDistanceKm(8.5);
        }

        if (data.containsKey("paymentMethod") && data.get("paymentMethod") != null) {
            trip.setPaymentMethod(data.get("paymentMethod").toString().toUpperCase());
        } else {
            trip.setPaymentMethod("CASH");
        }

        if (data.containsKey("status") && data.get("status") != null && !data.get("status").toString().isBlank()) {
            String s = data.get("status").toString().trim().toUpperCase();
            if ("ACTIVE".equals(s)) {
                trip.setStatus(TripStatus.IN_PROGRESS);
            } else {
                trip.setStatus(TripStatus.fromString(s));
            }
        } else {
            trip.setStatus(TripStatus.REQUESTED);
        }

        double estFare = data.containsKey("estimatedFare") ? ((Number) data.get("estimatedFare")).doubleValue() : 1250.0;
        trip.setTotalFare(estFare);
        trip.setPlatformCommission(Math.round(estFare * 0.15 * 100.0) / 100.0);
        trip.setDriverNet(Math.round(estFare * 0.85 * 100.0) / 100.0);
        Trip saved = tripDAO.save(trip);
        
        logAdminAction("CREATE_BOOKING", "Created new trip manually from " + trip.getPickupAddress(), saved.getId(), "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "id", saved.getId()));
    }

    private Map<String, Object> mapTripToBookingDetails(Trip t) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", t.getId());
        map.put("tripId", t.getId());
        map.put("pickupAddress", t.getPickupAddress() != null ? t.getPickupAddress() : "Colombo Fort");
        map.put("dropoffAddress", t.getDropoffAddress() != null ? t.getDropoffAddress() : "Bambalapitiya");
        map.put("pickupLat", t.getPickupLat() != null ? t.getPickupLat() : 6.9271);
        map.put("pickupLng", t.getPickupLng() != null ? t.getPickupLng() : 79.8612);
        map.put("dropoffLat", t.getDropoffLat() != null ? t.getDropoffLat() : 6.8911);
        map.put("dropoffLng", t.getDropoffLng() != null ? t.getDropoffLng() : 79.8550);
        map.put("status", t.getStatus() != null ? t.getStatus().name() : "REQUESTED");
        map.put("rideType", t.getRideType() != null ? t.getRideType().toLowerCase() : "standard");
        map.put("distanceKm", t.getDistanceKm() != null ? t.getDistanceKm() : 8.5);
        map.put("totalFare", t.getTotalFare() != null ? t.getTotalFare() : 1250.0);
        map.put("estimatedFare", t.getTotalFare() != null ? t.getTotalFare() : 1250.0);
        map.put("paymentMethod", t.getPaymentMethod() != null ? t.getPaymentMethod() : "CASH");
        map.put("isPaid", t.isPaid());
        map.put("paid", t.isPaid());
        map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");

        String pName = "Walk-in Passenger";
        String pPhone = "-";
        try {
            if (t.getPassenger() != null) {
                String first = t.getPassenger().getFirstName() != null ? t.getPassenger().getFirstName() : "";
                String last = t.getPassenger().getLastName() != null ? t.getPassenger().getLastName() : "";
                String full = (first + " " + last).trim();
                pName = full.isEmpty() ? "Passenger #" + t.getPassenger().getId() : full;
                pPhone = t.getPassenger().getPhone() != null ? t.getPassenger().getPhone() : "-";
            }
        } catch (Exception ignored) {}
        map.put("passengerName", pName);
        map.put("passengerPhone", pPhone);

        String dName = "NOT_ASSIGNED";
        String dPhone = "-";
        try {
            if (t.getDriver() != null) {
                String first = t.getDriver().getFirstName() != null ? t.getDriver().getFirstName() : "";
                String last = t.getDriver().getLastName() != null ? t.getDriver().getLastName() : "";
                String full = (first + " " + last).trim();
                dName = full.isEmpty() ? "Driver #" + t.getDriver().getId() : full;
                dPhone = t.getDriver().getPhone() != null ? t.getDriver().getPhone() : "-";
            }
        } catch (Exception ignored) {}
        map.put("driverName", dName);
        map.put("driverPhone", dPhone);

        return map;
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> getAllBookings() {
        List<Map<String, Object>> result = tripDAO.findAll().stream()
            .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0))
            .map(this::mapTripToBookingDetails)
            .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> getBooking(@PathVariable Long id) {
        return tripDAO.findById(id)
            .map(t -> ResponseEntity.ok(mapTripToBookingDetails(t)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 🚖 CHANUKA'S SUMMARY DASHBOARD ENDPOINT — UC21, UC22, UC23
     * Implements Section 2 SQL queries from 03_team_member_queries.sql:
     * - Query 2.1: View all trip requests and statuses
     * - Query 2.2: Filter active ongoing trips requiring live tracking
     * - Query 2.3: Trip summary breakdown by ride type (Tuk, Car, Van, Bike)
     */
    @GetMapping("/bookings/summary")
    public ResponseEntity<Map<String, Object>> getBookingsSummary() {
        List<Trip> allTrips = tripDAO.findAll();
        long totalTrips = allTrips.size();

        long activeCount = allTrips.stream().filter(t -> {
            TripStatus s = t.getStatus();
            return s == TripStatus.REQUESTED || s == TripStatus.ACCEPTED || 
                   s == TripStatus.EN_ROUTE || s == TripStatus.ARRIVED || 
                   s == TripStatus.IN_PROGRESS || s == TripStatus.ACTIVE;
        }).count();

        long completedCount = allTrips.stream().filter(t -> t.getStatus() == TripStatus.COMPLETED).count();
        long cancelledCount = allTrips.stream().filter(t -> t.getStatus() == TripStatus.CANCELLED).count();

        double totalRevenue = allTrips.stream()
            .mapToDouble(t -> t.getTotalFare() != null ? t.getTotalFare() : 0.0)
            .sum();

        double totalDistance = allTrips.stream()
            .mapToDouble(t -> t.getDistanceKm() != null ? t.getDistanceKm() : 0.0)
            .sum();

        double avgDistance = totalTrips > 0 ? (totalDistance / totalTrips) : 0.0;
        double avgFare = totalTrips > 0 ? (totalRevenue / totalTrips) : 0.0;

        // Group by status
        Map<String, Long> byStatus = allTrips.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                t -> t.getStatus() != null ? t.getStatus().name() : "UNKNOWN",
                java.util.stream.Collectors.counting()
            ));

        // Group by ride type (Query 2.3)
        Map<String, List<Trip>> tripsByRideType = allTrips.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                t -> {
                    String rt = t.getRideType();
                    if (rt == null || rt.isBlank()) return "standard";
                    String lower = rt.toLowerCase().trim();
                    if ("car".equals(lower)) return "standard";
                    if ("van".equals(lower)) return "xl";
                    if ("bike".equals(lower)) return "moto";
                    return lower;
                }
            ));

        List<Map<String, Object>> byRideTypeList = new java.util.ArrayList<>();
        String[] standardRideTypes = new String[] { "standard", "xl", "moto", "tuk" };
        for (String rtKey : standardRideTypes) {
            List<Trip> rtTrips = tripsByRideType.getOrDefault(rtKey, java.util.Collections.emptyList());
            long count = rtTrips.size();
            double rev = rtTrips.stream().mapToDouble(t -> t.getTotalFare() != null ? t.getTotalFare() : 0.0).sum();
            double dist = rtTrips.stream().mapToDouble(t -> t.getDistanceKm() != null ? t.getDistanceKm() : 0.0).sum();
            double avgDist = count > 0 ? (dist / count) : 0.0;
            double avgF = count > 0 ? (rev / count) : 0.0;

            Map<String, Object> rtItem = new java.util.HashMap<>();
            rtItem.put("rideType", rtKey);
            rtItem.put("totalTrips", count);
            rtItem.put("totalRevenue", Math.round(rev * 100.0) / 100.0);
            rtItem.put("avgDistanceKm", Math.round(avgDist * 10.0) / 10.0);
            rtItem.put("avgFare", Math.round(avgF * 100.0) / 100.0);
            byRideTypeList.add(rtItem);
        }

        // Active ongoing trips (Query 2.2)
        List<Map<String, Object>> activeTripsList = allTrips.stream()
            .filter(t -> {
                TripStatus s = t.getStatus();
                return s == TripStatus.REQUESTED || s == TripStatus.ACCEPTED || 
                       s == TripStatus.EN_ROUTE || s == TripStatus.ARRIVED || 
                       s == TripStatus.IN_PROGRESS || s == TripStatus.ACTIVE;
            })
            .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0))
            .map(this::mapTripToBookingDetails)
            .toList();

        // Recent trips (Query 2.1)
        List<Map<String, Object>> recentTripsList = allTrips.stream()
            .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0))
            .map(this::mapTripToBookingDetails)
            .toList();

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("totalBookings", totalTrips);
        resp.put("activeTrips", activeCount);
        resp.put("completedTrips", completedCount);
        resp.put("cancelledTrips", cancelledCount);
        resp.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        resp.put("avgDistanceKm", Math.round(avgDistance * 10.0) / 10.0);
        resp.put("avgFare", Math.round(avgFare * 100.0) / 100.0);
        resp.put("byStatus", byStatus);
        resp.put("byRideType", byRideTypeList);
        resp.put("activeOngoingTrips", activeTripsList);
        resp.put("recentTrips", recentTripsList);

        return ResponseEntity.ok(resp);
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<Map<String, Object>> updateBooking(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));

        if (updates.containsKey("status") && updates.get("status") != null) {
            TripStatus newStatus = TripStatus.fromString(updates.get("status").toString());
            
            if (trip.getStatus() == TripStatus.REQUESTED && newStatus == TripStatus.COMPLETED) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid state transition: A REQUESTED trip must be IN_PROGRESS before it can be COMPLETED."));
            }
            
            trip.setStatus(newStatus);
        }
        if (updates.containsKey("pickupAddress"))  trip.setPickupAddress((String) updates.get("pickupAddress"));
        if (updates.containsKey("dropoffAddress")) trip.setDropoffAddress((String) updates.get("dropoffAddress"));
        if (updates.containsKey("estimatedFare") && updates.get("estimatedFare") != null) {
            double estFare = ((Number) updates.get("estimatedFare")).doubleValue();
            trip.setTotalFare(estFare);
            trip.setPlatformCommission(Math.round(estFare * 0.15 * 100.0) / 100.0);
            trip.setDriverNet(Math.round(estFare * 0.85 * 100.0) / 100.0);
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

    @DeleteMapping("/bookings/{id}/force")
    public ResponseEntity<Map<String, String>> forceDeleteBooking(@PathVariable Long id) {
        Trip trip = tripDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found: " + id));
        
        // Remove associated payments to avoid foreign key constraints
        paymentDAO.findByTripId(id).ifPresent(paymentDAO::delete);
        
        tripDAO.delete(trip);
        
        logAdminAction("DELETE_BOOKING", "Permanently deleted booking ID " + id, id, "TRIP");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Trip " + id + " permanently deleted."));
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
            map.put("pickupAddress", t.getPickupAddress() != null ? t.getPickupAddress() : "Colombo Fort, Lotus Road");
            map.put("dropoffAddress", t.getDropoffAddress() != null ? t.getDropoffAddress() : "Galle Face Green, Colombo");
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
        String email = data.containsKey("email") && data.get("email") != null ? ((String) data.get("email")).trim().toLowerCase() : "";
        if (email.isEmpty() || !isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Email must be a valid email address containing the '@' symbol (e.g. driver@streetify.lk)."
            ));
        }
        if (userDAO.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Email '" + email + "' is already registered."
            ));
        }

        String phone = (String) data.get("phone");
        if (phone == null || phone.isBlank() || !isValidDriverPhone(phone)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567)."
            ));
        }

        Driver d = new Driver();
        if (data.containsKey("firstName")) d.setFirstName((String) data.get("firstName"));
        if (data.containsKey("lastName"))  d.setLastName((String) data.get("lastName"));
        d.setEmail(email);
        d.setPhone(phone);
        
        String nicVal = data.containsKey("nicStr") ? (String) data.get("nicStr") : (String) data.get("nic");
        if (nicVal != null && !nicVal.isEmpty()) d.setNic(nicVal);
        String licVal = data.containsKey("licenseStr") ? (String) data.get("licenseStr") : (String) data.get("licenseNumber");
        if (licVal != null && !licVal.isEmpty()) d.setLicenseNumber(licVal);
        
        String rawPassword = data.containsKey("password") && data.get("password") != null && !((String) data.get("password")).isBlank()
            ? ((String) data.get("password")).trim()
            : "1111";
        d.setPasswordHash(passwordEncoder.encode(rawPassword));
        d.setPlainPassword(rawPassword);
        d.setRole(UserRole.DRIVER);
        d.setActive(true);
        d.setVerificationStatus(DriverVerificationStatus.APPROVED);
        
        // Handle Vehicle & Security
        Vehicle vehicle = new Vehicle();
        vehicle.setDriver(d);
        vehicle.setVehicleType(data.containsKey("vehicleType") ? (String) data.get("vehicleType") : "car");
        vehicle.setMake(data.containsKey("make") ? (String) data.get("make") : "Toyota");
        vehicle.setModel(data.containsKey("model") ? (String) data.get("model") : "Prius");
        vehicle.setNumberPlate(data.containsKey("numberPlate") ? (String) data.get("numberPlate") : "CBA-1234");
        
        Object yearObj = data.get("year");
        if (yearObj != null) {
            if (yearObj instanceof Number) {
                vehicle.setYearOfManufacture(((Number) yearObj).intValue());
            } else if (yearObj instanceof String) {
                try { vehicle.setYearOfManufacture(Integer.parseInt((String) yearObj)); } catch (Exception e) { vehicle.setYearOfManufacture(2015); }
            }
        } else {
            vehicle.setYearOfManufacture(2015);
        }
        
        vehicle.setColor(data.containsKey("color") ? (String) data.get("color") : "White");
        d.setVehicle(vehicle);
        
        Driver saved = driverDAO.save(d);
        
        // Handle Documents
        if (data.containsKey("nicFile") && data.get("nicFile") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> fileData = (Map<String, Object>) data.get("nicFile");
            String base64 = (String) fileData.get("base64");
            if (base64 != null && base64.contains(",")) base64 = base64.split(",")[1];
            try {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64);
                String originalName = (String) fileData.get("name");
                java.io.File dir = new java.io.File("uploads/documents/" + saved.getId());
                if (!dir.exists()) dir.mkdirs();
                String filePath = "uploads/documents/" + saved.getId() + "/nic_" + System.currentTimeMillis() + "_" + originalName;
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), decoded);
                
                com.streetify.entity.DriverDocument nicDoc = new com.streetify.entity.DriverDocument();
                nicDoc.setDriver(saved);
                nicDoc.setDocType("nic");
                nicDoc.setOriginalFilename(originalName);
                nicDoc.setFilePath(filePath);
                nicDoc.setFileSizeBytes((long) decoded.length);
                nicDoc.setContentType((String) fileData.get("type"));
                nicDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
                nicDoc.setReviewerNote("Uploaded by Admin. NIC: " + data.get("nicStr"));
                nicDoc.setReviewedAt(java.time.LocalDateTime.now());
                driverDocumentDAO.save(nicDoc);
            } catch (Exception e) { e.printStackTrace(); }
        } else if (data.containsKey("nicStr") || data.containsKey("nic")) {
            nicVal = data.containsKey("nicStr") ? (String) data.get("nicStr") : (String) data.get("nic");
            com.streetify.entity.DriverDocument nicDoc = new com.streetify.entity.DriverDocument();
            nicDoc.setDriver(saved);
            nicDoc.setDocType("nic");
            nicDoc.setOriginalFilename("admin_entry_nic.txt");
            nicDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_nic.txt");
            nicDoc.setFileSizeBytes(1024L);
            nicDoc.setContentType("text/plain");
            nicDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            nicDoc.setReviewerNote("Manually entered NIC by Admin: " + nicVal);
            nicDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(nicDoc);
        }
        
        if (data.containsKey("licenseFile") && data.get("licenseFile") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> fileData = (Map<String, Object>) data.get("licenseFile");
            String base64 = (String) fileData.get("base64");
            if (base64 != null && base64.contains(",")) base64 = base64.split(",")[1];
            try {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64);
                String originalName = (String) fileData.get("name");
                java.io.File dir = new java.io.File("uploads/documents/" + saved.getId());
                if (!dir.exists()) dir.mkdirs();
                String filePath = "uploads/documents/" + saved.getId() + "/license_" + System.currentTimeMillis() + "_" + originalName;
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), decoded);
                
                com.streetify.entity.DriverDocument licDoc = new com.streetify.entity.DriverDocument();
                licDoc.setDriver(saved);
                licDoc.setDocType("license");
                licDoc.setOriginalFilename(originalName);
                licDoc.setFilePath(filePath);
                licDoc.setFileSizeBytes((long) decoded.length);
                licDoc.setContentType((String) fileData.get("type"));
                licDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
                licDoc.setReviewerNote("Uploaded by Admin. License: " + data.get("licenseStr"));
                licDoc.setReviewedAt(java.time.LocalDateTime.now());
                driverDocumentDAO.save(licDoc);
            } catch (Exception e) { e.printStackTrace(); }
        } else if (data.containsKey("licenseStr") || data.containsKey("licenseNumber")) {
            licVal = data.containsKey("licenseStr") ? (String) data.get("licenseStr") : (String) data.get("licenseNumber");
            com.streetify.entity.DriverDocument licDoc = new com.streetify.entity.DriverDocument();
            licDoc.setDriver(saved);
            licDoc.setDocType("license");
            licDoc.setOriginalFilename("admin_entry_license.txt");
            licDoc.setFilePath("uploads/documents/admin-entry/" + saved.getId() + "_license.txt");
            licDoc.setFileSizeBytes(1024L);
            licDoc.setContentType("text/plain");
            licDoc.setStatus(com.streetify.entity.DocumentStatus.APPROVED);
            licDoc.setReviewerNote("Manually entered License by Admin: " + licVal);
            licDoc.setReviewedAt(java.time.LocalDateTime.now());
            driverDocumentDAO.save(licDoc);
        }
        
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
        if (updates.containsKey("status") && updates.get("status") != null) {
            TripStatus newStatus = TripStatus.fromString(updates.get("status").toString());
            
            if (trip.getStatus() == TripStatus.REQUESTED && newStatus == TripStatus.COMPLETED) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid state transition: A REQUESTED trip must be IN_PROGRESS before it can be COMPLETED."));
            }
            
            trip.setStatus(newStatus);
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

                // Attach verification documents from driver_documents table
                List<Map<String, Object>> docList = driverDocumentDAO.findByDriverId(d.getId()).stream().map(doc -> {
                    Map<String, Object> dm = new java.util.HashMap<>();
                    dm.put("id", doc.getId());
                    dm.put("docType", doc.getDocType());
                    dm.put("originalFilename", doc.getOriginalFilename());
                    dm.put("filePath", doc.getFilePath());
                    dm.put("status", doc.getStatus().name());
                    dm.put("reviewerNote", doc.getReviewerNote());
                    dm.put("uploadedAt", doc.getUploadedAt());
                    return dm;
                }).toList();
                map.put("documents", docList);

                return map;
            }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/driver-documents")
    public ResponseEntity<List<Map<String, Object>>> getAllDriverDocuments() {
        List<Map<String, Object>> result = driverDocumentDAO.findAll().stream().map(doc -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", doc.getId());
            map.put("driverId", doc.getDriver() != null ? doc.getDriver().getId() : null);
            map.put("driverName", doc.getDriver() != null ? (doc.getDriver().getFirstName() + " " + doc.getDriver().getLastName()) : "Unknown");
            map.put("driverEmail", doc.getDriver() != null ? doc.getDriver().getEmail() : "");
            map.put("docType", doc.getDocType());
            map.put("originalFilename", doc.getOriginalFilename());
            map.put("filePath", doc.getFilePath());
            map.put("fileSizeBytes", doc.getFileSizeBytes());
            map.put("contentType", doc.getContentType());
            map.put("status", doc.getStatus().name());
            map.put("reviewerNote", doc.getReviewerNote());
            map.put("uploadedAt", doc.getUploadedAt());
            map.put("reviewedAt", doc.getReviewedAt());
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
            driver.setActive(true); // ACTIVATE driver upon admin approval
            
            // Update all submitted driver documents to APPROVED
            List<DriverDocument> docs = driverDocumentDAO.findByDriverId(id);
            for (DriverDocument doc : docs) {
                doc.setStatus(DocumentStatus.APPROVED);
                doc.setReviewedAt(java.time.LocalDateTime.now());
                doc.setReviewerNote("Approved by Driver Admin (Tharindu) / Super Admin");
                driverDocumentDAO.save(doc);
            }
            logAdminAction("APPROVE_DRIVER", "Approved driver & verification documents for Driver ID " + id, id, "USER");
        } else {
            driver.setVerificationStatus(DriverVerificationStatus.REJECTED);
            driver.setActive(false);
            
            // Update submitted driver documents to REJECTED
            List<DriverDocument> docs = driverDocumentDAO.findByDriverId(id);
            for (DriverDocument doc : docs) {
                doc.setStatus(DocumentStatus.REJECTED);
                doc.setReviewedAt(java.time.LocalDateTime.now());
                doc.setReviewerNote(data.getOrDefault("note", "Rejected by Driver Admin (Tharindu)"));
                driverDocumentDAO.save(doc);
            }
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
        
        Double commission = gross * 0.1;
        if (data.containsKey("platformCommission")) {
            commission = ((Number) data.get("platformCommission")).doubleValue();
        }
        if (commission > gross) {
            return ResponseEntity.badRequest().body(Map.of("error", "Platform commission cannot exceed gross amount"));
        }
        
        p.setPlatformCommission(commission);
        p.setDriverNet(gross - commission);

        if (data.containsKey("paymentMethod")) p.setPaymentMethod((String) data.get("paymentMethod"));
        else p.setPaymentMethod("CASH");
        
        p.setStatus(PaymentStatus.SUCCESS);
        p.setProcessedAt(java.time.LocalDateTime.now());
        Payment saved = paymentDAO.save(p);
        
        logAdminAction("CREATE_PAYMENT", "Created manual payment of LKR " + p.getGrossAmount(), saved.getId(), "PAYMENT");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment created."));
    }

    /**
     * Dedicated Financial Analytics Summary for Finance Manager (PAYMENT_MGMT - Daham)
     * Aggregates GMV gross revenue, 15% platform commission, 85% driver net payouts, 
     * settlement rates, and payment gateway breakdowns.
     */
    @GetMapping("/payments/summary")
    public ResponseEntity<Map<String, Object>> getPaymentsSummary() {
        List<Payment> allPayments = paymentDAO.findAll();
        long totalPayments = allPayments.size();

        long successCount = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.SUCCESS).count();
        long pendingCount = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.PENDING).count();
        long failedCount  = allPayments.stream().filter(p -> p.getStatus() == PaymentStatus.FAILED).count();

        double totalGrossRevenue = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
            .mapToDouble(p -> p.getGrossAmount() != null ? p.getGrossAmount() : 0.0)
            .sum();

        double totalCommission = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
            .mapToDouble(p -> p.getPlatformCommission() != null ? p.getPlatformCommission() : 0.0)
            .sum();

        double totalDriverNet = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
            .mapToDouble(p -> p.getDriverNet() != null ? p.getDriverNet() : 0.0)
            .sum();

        double avgFare = successCount > 0 ? (totalGrossRevenue / successCount) : 0.0;
        double successRate = totalPayments > 0 ? ((double) successCount / totalPayments * 100.0) : 100.0;

        // Group by payment method
        Map<String, List<Payment>> byMethodMap = allPayments.stream()
            .collect(java.util.stream.Collectors.groupingBy(p -> {
                String m = p.getPaymentMethod();
                return m != null ? m.toUpperCase().trim() : "CASH";
            }));

        List<Map<String, Object>> byMethodList = new java.util.ArrayList<>();
        for (Map.Entry<String, List<Payment>> entry : byMethodMap.entrySet()) {
            String method = entry.getKey();
            List<Payment> mList = entry.getValue();
            long count = mList.size();
            double methodGross = mList.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(p -> p.getGrossAmount() != null ? p.getGrossAmount() : 0.0).sum();
            double methodCommission = mList.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(p -> p.getPlatformCommission() != null ? p.getPlatformCommission() : 0.0).sum();
            double methodDriverNet = mList.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(p -> p.getDriverNet() != null ? p.getDriverNet() : 0.0).sum();

            Map<String, Object> item = new java.util.HashMap<>();
            item.put("paymentMethod", method);
            item.put("count", count);
            item.put("grossRevenue", Math.round(methodGross * 100.0) / 100.0);
            item.put("commission", Math.round(methodCommission * 100.0) / 100.0);
            item.put("driverNet", Math.round(methodDriverNet * 100.0) / 100.0);
            item.put("percentage", totalGrossRevenue > 0 ? Math.round((methodGross / totalGrossRevenue * 100.0) * 10.0) / 10.0 : 0.0);
            byMethodList.add(item);
        }

        Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("totalPayments", totalPayments);
        summary.put("successCount", successCount);
        summary.put("pendingCount", pendingCount);
        summary.put("failedCount", failedCount);
        summary.put("grossRevenue", Math.round(totalGrossRevenue * 100.0) / 100.0);
        summary.put("totalCommission", Math.round(totalCommission * 100.0) / 100.0);
        summary.put("totalDriverNet", Math.round(totalDriverNet * 100.0) / 100.0);
        summary.put("avgFare", Math.round(avgFare * 100.0) / 100.0);
        summary.put("successRate", Math.round(successRate * 10.0) / 10.0);
        summary.put("byMethod", byMethodList);

        return ResponseEntity.ok(summary);
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
            "tripId",            p.getTrip() != null ? p.getTrip().getId() : null,
            "driverName",        p.getDriver() != null ? p.getDriver().getFirstName() + " " + p.getDriver().getLastName() : "Unknown"
        )).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payments/{id:\\d+}")
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
        
        if (p.getPlatformCommission() > p.getGrossAmount()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Platform commission cannot exceed gross amount"));
        }
        
        if (updates.containsKey("driverNet")) {
            p.setDriverNet(((Number) updates.get("driverNet")).doubleValue());
        } else {
            p.setDriverNet(p.getGrossAmount() - p.getPlatformCommission());
        }
        paymentDAO.save(p);
        
        logAdminAction("UPDATE_PAYMENT", "Updated payment ID " + id, id, "PAYMENT");
        return ResponseEntity.ok(Map.<String, Object>of("status", "ok", "message", "Payment " + id + " updated."));
    }


    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Map<String, String>> deleteOrVoidPayment(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean hard
    ) {
        Payment p = paymentDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));
        if (hard) {
            paymentDAO.delete(p);
            logAdminAction("DELETE_PAYMENT", "Permanently deleted payment ID " + id, id, "PAYMENT");
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment " + id + " permanently deleted."));
        } else {
            p.setStatus(PaymentStatus.FAILED);
            p.setFailureReason("Voided by admin");
            paymentDAO.save(p);
            logAdminAction("VOID_PAYMENT", "Voided payment ID " + id, id, "PAYMENT");
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment " + id + " voided."));
        }
    }

    @DeleteMapping("/payments/{id}/delete")
    public ResponseEntity<Map<String, String>> hardDeletePayment(@PathVariable Long id) {
        Payment p = paymentDAO.findById(id).orElseThrow(() -> new IllegalArgumentException("Payment not found: " + id));
        paymentDAO.delete(p);
        logAdminAction("DELETE_PAYMENT", "Permanently deleted payment ID " + id, id, "PAYMENT");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment " + id + " permanently deleted."));
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
        passenger.setPlainPassword("streetify123");
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
        com.streetify.dto.TripRequestDTO estimateRequest = new com.streetify.dto.TripRequestDTO();
        estimateRequest.setPickupLat(pickupLat);
        estimateRequest.setPickupLng(pickupLng);
        estimateRequest.setDropoffLat(dropoffLat);
        estimateRequest.setDropoffLng(dropoffLng);
        estimateRequest.setRideType(rideType);
        double distanceKm = Math.max(1.5, Math.round(dispatchService.estimateFare(estimateRequest).getDistanceKm() * 10.0) / 10.0);

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
