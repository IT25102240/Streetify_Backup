package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * AuditLog — immutable admin governance trail.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_staff", columnList = "performed_by_staff_id"),
        @Index(name = "idx_audit_target", columnList = "target_user_id"),
        @Index(name = "idx_audit_created", columnList = "created_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "performed_by_staff_id", nullable = false)
    private Long performedByStaffId;

    @Column(name = "performed_by_email", nullable = false, length = 255)
    private String performedByEmail;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_entity_type", length = 50)
    private String targetEntityType;

    @Column(name = "target_entity_id")
    private Long targetEntityId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {}

    public static AuditLogBuilder builder() { return new AuditLogBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Long getPerformedByStaffId() { return performedByStaffId; }
    public String getPerformedByEmail() { return performedByEmail; }
    public String getActionType() { return actionType; }
    public String getDescription() { return description; }
    public Long getTargetUserId() { return targetUserId; }
    public String getTargetEntityType() { return targetEntityType; }
    public Long getTargetEntityId() { return targetEntityId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── Manual Builder ────────────────────────────────────────────────────────
    public static class AuditLogBuilder {
        private final AuditLog a = new AuditLog();
        public AuditLogBuilder performedByStaffId(Long id) { a.performedByStaffId = id; return this; }
        public AuditLogBuilder performedByEmail(String e) { a.performedByEmail = e; return this; }
        public AuditLogBuilder actionType(String t) { a.actionType = t; return this; }
        public AuditLogBuilder description(String d) { a.description = d; return this; }
        public AuditLogBuilder targetUserId(Long id) { a.targetUserId = id; return this; }
        public AuditLogBuilder targetEntityType(String t) { a.targetEntityType = t; return this; }
        public AuditLogBuilder targetEntityId(Long id) { a.targetEntityId = id; return this; }
        public AuditLog build() { return a; }
    }
}
