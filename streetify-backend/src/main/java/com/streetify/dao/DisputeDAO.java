package com.streetify.dao;

import com.streetify.entity.DisputeTicket;
import com.streetify.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DisputeDAO — Data Access Layer for DisputeTicket entities.
 *
 * Explicit query methods for:
 *   - Passenger dispute history
 *   - Staff pending queue
 *   - Resolution workflow
 */
@Repository
public interface DisputeDAO extends JpaRepository<DisputeTicket, Long> {

    /**
     * Find all disputes submitted by a specific passenger.
     * Used by GET /api/disputes/my-disputes
     */
    List<DisputeTicket> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);

    /**
     * Find all pending (OPEN) disputes — STAFF review queue.
     * Used by GET /api/staff/disputes/pending
     */
    @Query("SELECT d FROM DisputeTicket d WHERE d.status = 'OPEN' ORDER BY d.createdAt ASC")
    List<DisputeTicket> findAllPending();

    /**
     * Find all disputes with a specific status.
     */
    List<DisputeTicket> findByStatus(DisputeStatus status);

    /**
     * Count disputes by status.
     */
    long countByStatus(DisputeStatus status);

    /**
     * Find the dispute for a specific trip.
     */
    List<DisputeTicket> findByTripId(Long tripId);

    /**
     * Count all open disputes.
     * Admin dashboard: "Open Disputes" card.
     */
    @Query("SELECT COUNT(d) FROM DisputeTicket d WHERE d.status = 'OPEN' OR d.status = 'UNDER_REVIEW'")
    long countOpenDisputes();

    /**
     * Resolve a dispute — update status, resolution note, refund amount, and resolved timestamp.
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE DisputeTicket d
           SET d.status = :status,
               d.resolutionNote = :resolutionNote,
               d.approvedRefundAmount = :refundAmount,
               d.resolvedByStaffId = :staffId,
               d.resolvedAt = :resolvedAt
           WHERE d.id = :disputeId
           """)
    void resolveDispute(
            @Param("disputeId") Long disputeId,
            @Param("status") DisputeStatus status,
            @Param("resolutionNote") String resolutionNote,
            @Param("refundAmount") Double refundAmount,
            @Param("staffId") Long staffId,
            @Param("resolvedAt") LocalDateTime resolvedAt
    );
}
