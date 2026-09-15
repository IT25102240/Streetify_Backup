package com.streetify.dao;

import com.streetify.entity.DriverDocument;
import com.streetify.entity.DocumentStatus;
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
 * DriverDocumentDAO — Data Access Layer for DriverDocument entities.
 *
 * Supports the 3-step driver onboarding document upload flow.
 */
@Repository
public interface DriverDocumentDAO extends JpaRepository<DriverDocument, Long> {

    /**
     * Find all documents uploaded by a specific driver.
     * Used to check document completion status.
     */
    List<DriverDocument> findByDriverId(Long driverId);

    /**
     * Find a specific document type for a driver.
     * e.g., findByDriverIdAndDocType(42L, "license")
     */
    Optional<DriverDocument> findByDriverIdAndDocType(Long driverId, String docType);

    /**
     * Find all documents with a specific review status.
     * Admin/Staff: GET /api/admin/verifications → shows PENDING documents.
     */
    List<DriverDocument> findByStatus(DocumentStatus status);

    /**
     * Count how many documents for a driver are APPROVED.
     * If count == 3 → all documents verified → driver can be APPROVED.
     */
    @Query("SELECT COUNT(d) FROM DriverDocument d WHERE d.driver.id = :driverId AND d.status = 'APPROVED'")
    long countApprovedDocumentsByDriverId(@Param("driverId") Long driverId);

    /**
     * Update a document's review status (APPROVED or REJECTED).
     * Called by DriverVerificationService after STAFF action.
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE DriverDocument d
           SET d.status = :status,
               d.reviewerNote = :note,
               d.reviewedAt = :reviewedAt
           WHERE d.id = :docId
           """)
    void updateDocumentStatus(
            @Param("docId") Long docId,
            @Param("status") DocumentStatus status,
            @Param("note") String note,
            @Param("reviewedAt") LocalDateTime reviewedAt
    );
}
