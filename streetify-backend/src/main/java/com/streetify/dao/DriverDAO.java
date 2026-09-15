package com.streetify.dao;

import com.streetify.entity.Driver;
import com.streetify.entity.DriverVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * DriverDAO — Data Access Layer for Driver entities.
 *
 * Explicit custom query methods for:
 *   - Driver onboarding & verification workflow
 *   - Online/offline status management
 *   - Commission debt tracking
 *   - Live fleet monitoring (Admin)
 */
@Repository
public interface DriverDAO extends JpaRepository<Driver, Long> {

    // ─── Lookup Methods ──────────────────────────────────────────────────────

    /**
     * Find a driver by their NIC number.
     * Used during registration to prevent duplicate NIC registrations.
     */
    Optional<Driver> findByNic(String nic);

    /**
     * Find a driver by their email.
     */
    Optional<Driver> findByEmail(String email);

    /**
     * Find all drivers with a specific verification status.
     *
     * e.g., findByVerificationStatus(PENDING_VERIFICATION) →
     * Admin verification queue (GET /api/admin/verifications)
     */
    List<Driver> findByVerificationStatus(DriverVerificationStatus status);

    /**
     * Find all drivers with PENDING_VERIFICATION status.
     * Convenience method for the Admin document review queue.
     */
    @Query("SELECT d FROM Driver d WHERE d.verificationStatus = 'PENDING_VERIFICATION' ORDER BY d.createdAt ASC")
    List<Driver> findPendingDrivers();

    /**
     * Find all drivers currently online (available to receive trips).
     * Used by DispatchService to find nearby drivers.
     */
    @Query("SELECT d FROM Driver d WHERE d.online = true AND d.verificationStatus = 'APPROVED' AND d.suspended = false")
    List<Driver> findAllOnlineApprovedDrivers();

    /**
     * Find all online drivers within a bounding box (for nearby driver search).
     * Uses lat/lng bounds for efficient geospatial filtering.
     *
     * @param minLat southern boundary
     * @param maxLat northern boundary
     * @param minLng western boundary
     * @param maxLng eastern boundary
     */
    @Query("""
           SELECT d FROM Driver d
           WHERE d.online = true
             AND d.verificationStatus = 'APPROVED'
             AND d.suspended = false
             AND d.currentLat BETWEEN :minLat AND :maxLat
             AND d.currentLng BETWEEN :minLng AND :maxLng
           """)
    List<Driver> findNearbyOnlineDrivers(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng
    );

    /**
     * Check if a vehicle plate is already registered.
     */
    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.numberPlate = :plate")
    boolean existsByVehicleNumberPlate(@Param("plate") String plate);

    // ─── Update Methods ───────────────────────────────────────────────────────

    /**
     * Toggle driver online/offline status.
     * Called by PATCH /api/driver/:id/status
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.online = :online WHERE d.id = :driverId")
    void updateOnlineStatus(@Param("driverId") Long driverId, @Param("online") boolean online);

    /**
     * Update the driver's current GPS position.
     * Called every 2-3 seconds via WebSocket telemetry.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.currentLat = :lat, d.currentLng = :lng WHERE d.id = :driverId")
    void updateCurrentLocation(
            @Param("driverId") Long driverId,
            @Param("lat") Double lat,
            @Param("lng") Double lng
    );

    /**
     * Update driver's verification status.
     * Called by DriverVerificationService after STAFF review.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.verificationStatus = :status WHERE d.id = :driverId")
    void updateVerificationStatus(
            @Param("driverId") Long driverId,
            @Param("status") DriverVerificationStatus status
    );

    /**
     * Increment the driver's total completed trips.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.totalTrips = d.totalTrips + 1 WHERE d.id = :driverId")
    void incrementTotalTrips(@Param("driverId") Long driverId);

    /**
     * Add to driver's commission debt (platform owes collection).
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.commissionDebt = d.commissionDebt + :amount WHERE d.id = :driverId")
    void addCommissionDebt(@Param("driverId") Long driverId, @Param("amount") Double amount);

    /**
     * Update driver's average rating.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.averageRating = :rating WHERE d.id = :driverId")
    void updateAverageRating(@Param("driverId") Long driverId, @Param("rating") Double rating);

    /**
     * Credit driver's wallet balance.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Driver d SET d.walletBalance = d.walletBalance + :amount WHERE d.id = :driverId")
    void creditWallet(@Param("driverId") Long driverId, @Param("amount") Double amount);
}
