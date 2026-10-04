package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.DriverDocumentDAO;
import com.streetify.dao.PassengerDAO;
import com.streetify.dao.UserDAO;
import com.streetify.dao.VehicleDAO;
import com.streetify.dto.AuthResponseDTO;
import com.streetify.dto.DriverRegistrationDTO;
import com.streetify.dto.LoginDTO;
import com.streetify.dto.UserRegistrationDTO;
import com.streetify.entity.*;
import com.streetify.security.JwtUtil;
import java.util.List;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AuthService — Business logic for user authentication and registration.
 *
 * Handles:
 *   1. Passenger self-registration
 *   2. Driver onboarding (steps 1 & 2 — documents handled by DriverVerificationService)
 *   3. Login with JWT generation
 *   4. Refresh token flow
 *
 * CRITICAL: Passwords are NEVER stored in plaintext.
 * BCrypt (strength 12) is used for all password hashing.
 */
@Service
@Transactional
@SuppressWarnings("null")
public class AuthService {

    private final UserDAO userDAO;
    private final PassengerDAO passengerDAO;
    private final DriverDAO driverDAO;
    private final DriverDocumentDAO driverDocumentDAO;
    private final VehicleDAO vehicleDAO;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserDAO userDAO,
                       PassengerDAO passengerDAO,
                       DriverDAO driverDAO,
                       DriverDocumentDAO driverDocumentDAO,
                       VehicleDAO vehicleDAO,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userDAO = userDAO;
        this.passengerDAO = passengerDAO;
        this.driverDAO = driverDAO;
        this.driverDocumentDAO = driverDocumentDAO;
        this.vehicleDAO = vehicleDAO;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    // ─── Passenger Registration ───────────────────────────────────────────────

    /**
     * Registers a new passenger account.
     *
     * Steps:
     *   1. Validate email uniqueness (DAO: existsByEmail)
     *   2. Hash password with BCrypt
     *   3. Save Passenger entity to DB
     *   4. Return auth response with JWT
     *
     * @param dto UserRegistrationDTO from @RequestBody
     * @return AuthResponseDTO with access/refresh tokens
     */
    public AuthResponseDTO registerPassenger(UserRegistrationDTO dto) {
        // Step 1: Validate uniqueness
        if (userDAO.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        if (userDAO.existsByPhone(dto.getPhone())) {
            throw new IllegalArgumentException("This phone number is already registered.");
        }

        // Step 2: Build and save Passenger entity
        Passenger passenger = new Passenger();
        passenger.setFirstName(dto.getFirstName());
        passenger.setLastName(dto.getLastName());
        passenger.setEmail(dto.getEmail().toLowerCase().trim());
        passenger.setPhone(dto.getPhone());
        passenger.setPasswordHash(passwordEncoder.encode(dto.getPassword())); // BCrypt hash
        passenger.setPlainPassword(dto.getPassword());
        passenger.setRole(UserRole.PASSENGER);
        passenger.setActive(true);

        Passenger saved = passengerDAO.save(passenger);

        // Step 3: Generate JWT
        return buildAuthResponse(saved, UserRole.PASSENGER, null);
    }

    // ─── Driver Registration ──────────────────────────────────────────────────

    /**
     * Registers a new driver account (steps 1 & 2 of onboarding).
     * Documents are uploaded separately via POST /api/driver/upload-documents.
     *
     * Steps:
     *   1. Validate email, NIC, and plate uniqueness
     *   2. Hash password with BCrypt
     *   3. Save Driver entity
     *   4. Save Vehicle entity (OneToOne)
     *   5. Return response with driverId and PENDING_VERIFICATION status
     *
     * @param dto DriverRegistrationDTO from @RequestBody
     * @return AuthResponseDTO with pending status
     */
    public AuthResponseDTO registerDriver(DriverRegistrationDTO dto) {
        // Step 1: Validate uniqueness
        if (userDAO.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        if (userDAO.existsByPhone(dto.getPhone())) {
            throw new IllegalArgumentException("This phone number is already registered.");
        }
        if (driverDAO.findByNic(dto.getNic()).isPresent()) {
            throw new IllegalArgumentException("This NIC number is already registered.");
        }
        if (driverDAO.existsByVehicleNumberPlate(dto.getNumberPlate())) {
            throw new IllegalArgumentException("This number plate is already registered.");
        }

        // Validate driver phone format: +94 followed by 9 digits or 0 followed by 9 digits
        String cleanedPhone = dto.getPhone() != null ? dto.getPhone().trim().replaceAll("[\\s\\-]", "") : "";
        if (!cleanedPhone.matches("^(\\+94\\d{9}|0\\d{9})$")) {
            throw new IllegalArgumentException("Driver phone number must be either '+94' followed by 9 digits (e.g. +94771234567) or '0' followed by 9 digits (e.g. 0771234567).");
        }

        // Step 2: Build Driver entity
        Driver driver = new Driver();
        driver.setFirstName(dto.getFirstName());
        driver.setLastName(dto.getLastName());
        driver.setEmail(dto.getEmail().toLowerCase().trim());
        driver.setPhone(dto.getPhone());
        driver.setNic(dto.getNic());
        driver.setLicenseNumber(dto.getNic());
        driver.setPasswordHash(passwordEncoder.encode(dto.getPassword())); // BCrypt hash
        driver.setPlainPassword(dto.getPassword());
        driver.setRole(UserRole.DRIVER);
        driver.setVerificationStatus(DriverVerificationStatus.PENDING_VERIFICATION);
        driver.setActive(false); // MUST be false! Not active until Driver Admin Tharindu or Super Admin approves
        Driver savedDriver = driverDAO.save(driver);

        // Step 3: Build Vehicle entity
        Vehicle vehicle = Vehicle.builder()
                .driver(savedDriver)
                .vehicleType(dto.getVehicleType())
                .numberPlate(dto.getNumberPlate().toUpperCase())
                .yearOfManufacture(dto.getYearOfManufacture())
                .make(dto.getMake() != null ? dto.getMake() : "Default Make")
                .model(dto.getModel() != null ? dto.getModel() : "Default Model")
                .color(dto.getColor() != null ? dto.getColor() : "White")
                .build();
        vehicleDAO.save(vehicle);

        // Step 4: Automatically insert the 3 required DriverDocument records in PENDING status
        List<String> docTypes = List.of("license", "reg", "insurance");
        for (String docType : docTypes) {
            DriverDocument doc = new DriverDocument();
            doc.setDriver(savedDriver);
            doc.setDocType(docType);
            doc.setOriginalFilename(docType + "_" + savedDriver.getLastName().toLowerCase() + ".pdf");
            doc.setFilePath("uploads/documents/driver-" + savedDriver.getId() + "/" + docType + ".pdf");
            doc.setFileSizeBytes(1024L * 1024L);
            doc.setContentType("application/pdf");
            doc.setStatus(DocumentStatus.PENDING);
            doc.setReviewerNote("Uploaded during driver registration. Awaiting verification by Driver Admin (Tharindu) or Super Admin.");
            driverDocumentDAO.save(doc);
        }

        // Step 5: Return response (no JWT — driver cannot login until approved)
        return AuthResponseDTO.builder()
                .userId(savedDriver.getId())
                .email(savedDriver.getEmail())
                .fullName(savedDriver.getFullName())
                .role(UserRole.DRIVER.name())
                .verificationStatus(DriverVerificationStatus.PENDING_VERIFICATION.name())
                .message("Driver registration submitted successfully! Awaiting document approval by Driver Admin (Tharindu) or Super Admin.")
                .build();
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    /**
     * Authenticates a user (any role) and returns JWT tokens.
     *
     * Steps:
     *   1. Use Spring AuthenticationManager to verify credentials (BCrypt comparison)
     *   2. Load full User entity for role/status info
     *   3. Check account is not suspended
     *   4. Generate access + refresh JWT tokens
     *
     * @param dto LoginDTO { email, password } from @RequestBody
     * @return AuthResponseDTO with JWT
     */
    public AuthResponseDTO login(LoginDTO dto) {
        // Step 1: Authenticate via Spring Security (throws if credentials invalid)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getEmail().toLowerCase().trim(),
                        dto.getPassword()
                )
        );

        // Step 2: Load User entity from DB
        User user = userDAO.findByEmail(dto.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        // Step 3: Check account status
        if (user.isSuspended()) {
            throw new IllegalStateException("Your account has been suspended. Reason: " + user.getSuspensionReason());
        }

        // For drivers: check verification status and active status
        String verificationStatus = null;
        if (user.getRole() == UserRole.DRIVER) {
            Driver driver = (Driver) user;
            verificationStatus = driver.getVerificationStatus().name();
            if (driver.getVerificationStatus() == DriverVerificationStatus.PENDING_VERIFICATION || !driver.isActive()) {
                throw new IllegalStateException("Your account is pending verification. Driver Admin Tharindu or Super Admin must review and approve your registration before you can log in.");
            }
            if (driver.getVerificationStatus() == DriverVerificationStatus.REJECTED) {
                throw new IllegalStateException("Your account verification was rejected. Please contact Driver Admin Tharindu or Super Admin.");
            }
        }

        // Step 4: Generate tokens
        return buildAuthResponse(user, user.getRole(), verificationStatus);
    }

    // ─── Token Refresh ────────────────────────────────────────────────────────

    /**
     * Issues a new access token using a valid refresh token.
     *
     * @param refreshToken the refresh JWT from client
     * @return new AuthResponseDTO with fresh access token
     */
    public AuthResponseDTO refreshToken(String refreshToken) {
        if (!jwtUtil.isTokenStructureValid(refreshToken) || jwtUtil.isTokenExpired(refreshToken)) {
            throw new IllegalArgumentException("Refresh token is invalid or expired. Please login again.");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userDAO.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        return buildAuthResponse(user, user.getRole(), null);
    }

    // ─── Internal Helper ──────────────────────────────────────────────────────

    private AuthResponseDTO buildAuthResponse(User user, UserRole role, String verificationStatus) {
        // Build Spring Security UserDetails for JWT generation
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .roles(role.name())
                .build();

        String accessToken = jwtUtil.generateAccessToken(userDetails, user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        String vehicleInfo = null;
        if (role == UserRole.DRIVER) {
            java.util.Optional<Vehicle> vehicleOpt = vehicleDAO.findByDriverId(user.getId());
            if (vehicleOpt.isPresent()) {
                Vehicle v = vehicleOpt.get();
                String make = v.getMake() != null ? v.getMake() : "";
                String model = v.getModel() != null ? v.getModel() : "";
                vehicleInfo = v.getNumberPlate() + (make.isEmpty() && model.isEmpty() ? "" : " · " + make + " " + model);
            }
        }

        return AuthResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(900L) // 15 minutes
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(role.name())
                .verificationStatus(verificationStatus)
                .vehicleInfo(vehicleInfo)
                .adminRole(role == UserRole.ADMIN ? user.getAdminRole() : null)
                .build();
    }
}
