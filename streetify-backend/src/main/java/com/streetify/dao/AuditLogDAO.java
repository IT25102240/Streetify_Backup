package com.streetify.dao;

import com.streetify.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AuditLogDAO — Data Access Layer for AuditLog entities.
 *
 * AuditLog is APPEND-ONLY — no update or delete methods are provided.
 * This enforces the immutability guarantee of the audit trail.
 *
 * All reads are ordered by createdAt DESC (most recent first).
 */
@Repository
public interface AuditLogDAO extends JpaRepository<AuditLog, Long> {

    /**
     * Find the most recent N audit log entries.
     * Admin Console: GET /api/admin/audit?limit=50
     *
     * @param pageable use PageRequest.of(0, limit)
     */
    @Query("SELECT a FROM AuditLog a ORDER BY a.createdAt DESC")
    List<AuditLog> findRecentLogs(Pageable pageable);

    /**
     * Find all audit logs created by a specific staff member.
     */
    List<AuditLog> findByPerformedByStaffIdOrderByCreatedAtDesc(Long staffId);

    /**
     * Find all audit logs targeting a specific user.
     * e.g., "Show me all admin actions taken against user USR-4521"
     */
    List<AuditLog> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    /**
     * Find all audit logs of a specific action type.
     * e.g., findByActionType("ACCOUNT_SUSPENDED")
     */
    List<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType);

    /**
     * Find audit logs between two timestamps.
     * Used for date-range export functionality.
     */
    @Query("""
           SELECT a FROM AuditLog a
           WHERE a.createdAt BETWEEN :from AND :to
           ORDER BY a.createdAt DESC
           """)
    List<AuditLog> findByCreatedAtBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
