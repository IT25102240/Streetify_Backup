package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Payment — Records the financial transaction for each completed trip.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_trip", columnList = "trip_id"),
        @Index(name = "idx_payments_passenger", columnList = "passenger_id")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "gross_amount", nullable = false)
    private Double grossAmount;

    @Column(name = "platform_commission", nullable = false)
    private Double platformCommission;

    @Column(name = "driver_net", nullable = false)
    private Double driverNet;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "failure_reason", length = 200)
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public Payment() {}

    public static PaymentBuilder builder() { return new PaymentBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public Passenger getPassenger() { return passenger; }
    public Driver getDriver() { return driver; }
    public Double getGrossAmount() { return grossAmount; }
    public Double getPlatformCommission() { return platformCommission; }
    public Double getDriverNet() { return driverNet; }
    public String getPaymentMethod() { return paymentMethod; }
    public PaymentStatus getStatus() { return status; }
    public Integer getRetryCount() { return retryCount; }
    public String getFailureReason() { return failureReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public void setPassenger(Passenger passenger) { this.passenger = passenger; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }
    public void setPlatformCommission(Double platformCommission) { this.platformCommission = platformCommission; }
    public void setDriverNet(Double driverNet) { this.driverNet = driverNet; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    // ── Manual Builder ────────────────────────────────────────────────────────
    public static class PaymentBuilder {
        private final Payment p = new Payment();
        public PaymentBuilder trip(Trip t) { p.trip = t; return this; }
        public PaymentBuilder passenger(Passenger ps) { p.passenger = ps; return this; }
        public PaymentBuilder driver(Driver d) { p.driver = d; return this; }
        public PaymentBuilder grossAmount(Double a) { p.grossAmount = a; return this; }
        public PaymentBuilder platformCommission(Double c) { p.platformCommission = c; return this; }
        public PaymentBuilder driverNet(Double n) { p.driverNet = n; return this; }
        public PaymentBuilder paymentMethod(String m) { p.paymentMethod = m; return this; }
        public PaymentBuilder status(PaymentStatus s) { p.status = s; return this; }
        public PaymentBuilder retryCount(Integer r) { p.retryCount = r; return this; }
        public Payment build() { return p; }
    }
}
