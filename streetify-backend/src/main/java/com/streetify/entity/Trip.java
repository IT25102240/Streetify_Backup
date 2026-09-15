package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Trip — Core ride entity for Streetify.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "trips", indexes = {
        @Index(name = "idx_trips_passenger", columnList = "passenger_id"),
        @Index(name = "idx_trips_driver", columnList = "driver_id"),
        @Index(name = "idx_trips_status", columnList = "status")
})
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "pickup_address", nullable = false, length = 500)
    private String pickupAddress;

    @Column(name = "pickup_lat", nullable = false)
    private Double pickupLat;

    @Column(name = "pickup_lng", nullable = false)
    private Double pickupLng;

    @Column(name = "dropoff_address", nullable = false, length = 500)
    private String dropoffAddress;

    @Column(name = "dropoff_lat", nullable = false)
    private Double dropoffLat;

    @Column(name = "dropoff_lng", nullable = false)
    private Double dropoffLng;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "ride_type", nullable = false, length = 20)
    private String rideType;

    @Column(name = "base_fare")
    private Double baseFare;

    @Column(name = "per_km_rate")
    private Double perKmRate;

    @Column(name = "platform_fee")
    private Double platformFee = 4.0;

    @Column(name = "total_fare")
    private Double totalFare;

    @Column(name = "platform_commission")
    private Double platformCommission;

    @Column(name = "driver_net")
    private Double driverNet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status = TripStatus.REQUESTED;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 300)
    private String cancellationReason;

    @Column(name = "no_show_fee")
    private Double noShowFee;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "is_paid", nullable = false)
    private boolean paid = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Trip() {}

    public static TripBuilder builder() { return new TripBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Passenger getPassenger() { return passenger; }
    public Driver getDriver() { return driver; }
    public String getPickupAddress() { return pickupAddress; }
    public Double getPickupLat() { return pickupLat; }
    public Double getPickupLng() { return pickupLng; }
    public String getDropoffAddress() { return dropoffAddress; }
    public Double getDropoffLat() { return dropoffLat; }
    public Double getDropoffLng() { return dropoffLng; }
    public Double getDistanceKm() { return distanceKm; }
    public String getRideType() { return rideType; }
    public Double getBaseFare() { return baseFare; }
    public Double getPerKmRate() { return perKmRate; }
    public Double getPlatformFee() { return platformFee; }
    public Double getTotalFare() { return totalFare; }
    public Double getPlatformCommission() { return platformCommission; }
    public Double getDriverNet() { return driverNet; }
    public TripStatus getStatus() { return status; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public String getCancellationReason() { return cancellationReason; }
    public Double getNoShowFee() { return noShowFee; }
    public String getPaymentMethod() { return paymentMethod; }
    public boolean isPaid() { return paid; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setPassenger(Passenger passenger) { this.passenger = passenger; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
    public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }
    public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }
    public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }
    public void setDropoffLat(Double dropoffLat) { this.dropoffLat = dropoffLat; }
    public void setDropoffLng(Double dropoffLng) { this.dropoffLng = dropoffLng; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
    public void setRideType(String rideType) { this.rideType = rideType; }
    public void setBaseFare(Double baseFare) { this.baseFare = baseFare; }
    public void setPerKmRate(Double perKmRate) { this.perKmRate = perKmRate; }
    public void setPlatformFee(Double platformFee) { this.platformFee = platformFee; }
    public void setTotalFare(Double totalFare) { this.totalFare = totalFare; }
    public void setPlatformCommission(Double platformCommission) { this.platformCommission = platformCommission; }
    public void setDriverNet(Double driverNet) { this.driverNet = driverNet; }
    public void setStatus(TripStatus status) { this.status = status; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public void setNoShowFee(Double noShowFee) { this.noShowFee = noShowFee; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setPaid(boolean paid) { this.paid = paid; }

    // ── Manual Builder ─────────────────────────────────────────────────────────
    public static class TripBuilder {
        private final Trip t = new Trip();
        public TripBuilder passenger(Passenger p) { t.passenger = p; return this; }
        public TripBuilder driver(Driver d) { t.driver = d; return this; }
        public TripBuilder pickupAddress(String a) { t.pickupAddress = a; return this; }
        public TripBuilder pickupLat(Double lat) { t.pickupLat = lat; return this; }
        public TripBuilder pickupLng(Double lng) { t.pickupLng = lng; return this; }
        public TripBuilder dropoffAddress(String a) { t.dropoffAddress = a; return this; }
        public TripBuilder dropoffLat(Double lat) { t.dropoffLat = lat; return this; }
        public TripBuilder dropoffLng(Double lng) { t.dropoffLng = lng; return this; }
        public TripBuilder distanceKm(Double d) { t.distanceKm = d; return this; }
        public TripBuilder rideType(String rt) { t.rideType = rt; return this; }
        public TripBuilder baseFare(Double f) { t.baseFare = f; return this; }
        public TripBuilder perKmRate(Double r) { t.perKmRate = r; return this; }
        public TripBuilder platformFee(Double f) { t.platformFee = f; return this; }
        public TripBuilder totalFare(Double f) { t.totalFare = f; return this; }
        public TripBuilder platformCommission(Double c) { t.platformCommission = c; return this; }
        public TripBuilder driverNet(Double n) { t.driverNet = n; return this; }
        public TripBuilder paymentMethod(String m) { t.paymentMethod = m; return this; }
        public TripBuilder status(TripStatus s) { t.status = s; return this; }
        public Trip build() { return t; }
    }
}
