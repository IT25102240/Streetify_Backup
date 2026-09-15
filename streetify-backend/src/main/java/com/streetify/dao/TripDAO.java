package com.streetify.dao;

import com.streetify.entity.Trip;
import com.streetify.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * TripDAO — Data Access Layer for Trip entities.
 *
 * Explicit custom query methods for:
 *   - Booking dispatch (find REQUESTED trips)
 *   - Driver current trip (find active trip for a driver)
 *   - Passenger trip history
 *   - Admin revenue reporting
 *   - No-show detection (arrived > 5 minutes)
 */
@Repository
public interface TripDAO extends JpaRepository<Trip, Long> {

    // ─── Driver-focused Queries ───────────────────────────────────────────────

    /**
     * Find the active trip for a specific driver.
     * "Active" = EN_ROUTE, ARRIVED, or IN_PROGRESS.
     * Used by GET /api/trips/current
     *
     * @param driverId the driver's ID
     * @return Optional<Trip>
     */
    @Query("""
           SELECT t FROM Trip t
           WHERE t.driver.id = :driverId
             AND t.status IN ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')
           ORDER BY t.createdAt DESC
           """)
    Optional<Trip> findActiveTrip_ByDriverId(@Param("driverId") Long driverId);

    /**
     * Find trips for a driver with a specific status.
     * e.g., findByDriverIdAndStatus(42L, REQUESTED) → new offers for this driver
     */
    List<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);

    /**
     * Find all REQUESTED trips (no driver assigned yet).
     * DispatchService broadcasts these to online drivers via WebSocket.
     */
    @Query("SELECT t FROM Trip t WHERE t.status = 'REQUESTED' ORDER BY t.createdAt ASC")
    List<Trip> findAllRequestedTrips();

    /**
     * Count completed trips for a driver.
     */
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.driver.id = :driverId AND t.status = 'COMPLETED'")
    long countCompletedTripsByDriver(@Param("driverId") Long driverId);

    // ─── Passenger-focused Queries ────────────────────────────────────────────

    /**
     * Find all trips for a passenger, ordered by most recent first.
     * Used by GET /api/rides/history
     */
    List<Trip> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);

    /**
     * Find all trips for a passenger with a specific status.
     */
    List<Trip> findByPassengerIdAndStatus(Long passengerId, TripStatus status);

    /**
     * Find the active trip for a passenger (if any).
     * Used to prevent double booking.
     */
    @Query("""
           SELECT t FROM Trip t
           WHERE t.passenger.id = :passengerId
             AND t.status IN ('REQUESTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')
           """)
    Optional<Trip> findActiveTrip_ByPassengerId(@Param("passengerId") Long passengerId);

    // ─── Status Update ────────────────────────────────────────────────────────

    /**
     * Update the status of a trip.
     * Called by TripTrackingService as driver advances through states.
     *
     * @param tripId    the trip's ID
     * @param status    the new TripStatus
     */
    @Modifying
    @Transactional
    @Query("UPDATE Trip t SET t.status = :status WHERE t.id = :tripId")
    void updateTripStatus(@Param("tripId") Long tripId, @Param("status") TripStatus status);

    /**
     * Assign a driver to a REQUESTED trip (dispatch).
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE Trip t
           SET t.driver.id = :driverId,
               t.status = 'ACCEPTED',
               t.acceptedAt = :acceptedAt
           WHERE t.id = :tripId AND t.status = 'REQUESTED'
           """)
    void assignDriverToTrip(
            @Param("tripId") Long tripId,
            @Param("driverId") Long driverId,
            @Param("acceptedAt") LocalDateTime acceptedAt
    );

    /**
     * Mark a trip as ARRIVED and record the arrival timestamp.
     * Starts the 5-minute no-show timer countdown.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Trip t SET t.status = 'ARRIVED', t.arrivedAt = :arrivedAt WHERE t.id = :tripId")
    void markArrived(@Param("tripId") Long tripId, @Param("arrivedAt") LocalDateTime arrivedAt);

    /**
     * Mark a trip as IN_PROGRESS (passenger on board).
     */
    @Modifying
    @Transactional
    @Query("UPDATE Trip t SET t.status = 'IN_PROGRESS', t.startedAt = :startedAt WHERE t.id = :tripId")
    void markInProgress(@Param("tripId") Long tripId, @Param("startedAt") LocalDateTime startedAt);

    /**
     * Complete a trip — sets status, timestamp, and marks as paid.
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE Trip t
           SET t.status = 'COMPLETED',
               t.completedAt = :completedAt
           WHERE t.id = :tripId
           """)
    void markCompleted(@Param("tripId") Long tripId, @Param("completedAt") LocalDateTime completedAt);

    // ─── No-Show Detection ────────────────────────────────────────────────────

    /**
     * Find ARRIVED trips where the driver has been waiting more than 5 minutes.
     * These are eligible for no-show cancellation without penalty.
     *
     * @param cutoffTime = LocalDateTime.now().minusMinutes(5)
     */
    @Query("""
           SELECT t FROM Trip t
           WHERE t.status = 'ARRIVED'
             AND t.arrivedAt < :cutoffTime
           """)
    List<Trip> findNoShowEligibleTrips(@Param("cutoffTime") LocalDateTime cutoffTime);

    // ─── Admin Revenue Queries ────────────────────────────────────────────────

    /**
     * Get total revenue (platform commission) for today.
     * Admin dashboard: Revenue Today card.
     */
    @Query("""
           SELECT COALESCE(SUM(t.platformCommission), 0)
           FROM Trip t
           WHERE t.status = 'COMPLETED'
             AND t.completedAt >= :startOfDay
           """)
    Double sumPlatformCommissionSince(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Count trips by status for admin fleet monitor.
     */
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = :status")
    long countByStatus(@Param("status") TripStatus status);
}
