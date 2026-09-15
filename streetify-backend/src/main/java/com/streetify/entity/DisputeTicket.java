package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * DisputeTicket — passenger support dispute.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "dispute_tickets", indexes = {
        @Index(name = "idx_dispute_passenger", columnList = "passenger_id"),
        @Index(name = "idx_dispute_status", columnList = "status")
})
public class DisputeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "dispute_type", nullable = false, length = 50)
    private String disputeType;

    @Column(name = "requested_refund_amount")
    private Double requestedRefundAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;

    @Column(name = "approved_refund_amount")
    private Double approvedRefundAmount;

    @Column(name = "resolved_by_staff_id")
    private Long resolvedByStaffId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public DisputeTicket() {}

    public static DisputeTicketBuilder builder() { return new DisputeTicketBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Passenger getPassenger() { return passenger; }
    public Trip getTrip() { return trip; }
    public String getSubject() { return subject; }
    public String getDescription() { return description; }
    public String getDisputeType() { return disputeType; }
    public Double getRequestedRefundAmount() { return requestedRefundAmount; }
    public DisputeStatus getStatus() { return status; }
    public String getResolutionNote() { return resolutionNote; }
    public Double getApprovedRefundAmount() { return approvedRefundAmount; }
    public Long getResolvedByStaffId() { return resolvedByStaffId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setStatus(DisputeStatus status) { this.status = status; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public void setApprovedRefundAmount(Double approvedRefundAmount) { this.approvedRefundAmount = approvedRefundAmount; }
    public void setResolvedByStaffId(Long resolvedByStaffId) { this.resolvedByStaffId = resolvedByStaffId; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    // ── Manual Builder ────────────────────────────────────────────────────────
    public static class DisputeTicketBuilder {
        private final DisputeTicket d = new DisputeTicket();
        public DisputeTicketBuilder passenger(Passenger p) { d.passenger = p; return this; }
        public DisputeTicketBuilder trip(Trip t) { d.trip = t; return this; }
        public DisputeTicketBuilder subject(String s) { d.subject = s; return this; }
        public DisputeTicketBuilder description(String desc) { d.description = desc; return this; }
        public DisputeTicketBuilder disputeType(String dt) { d.disputeType = dt; return this; }
        public DisputeTicketBuilder requestedRefundAmount(Double amt) { d.requestedRefundAmount = amt; return this; }
        public DisputeTicketBuilder status(DisputeStatus s) { d.status = s; return this; }
        public DisputeTicket build() { return d; }
    }
}
