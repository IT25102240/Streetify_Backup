package com.streetify.entity;

import jakarta.persistence.*;

/**
 * Driver — Extends User for driver-specific attributes.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@DiscriminatorValue("DRIVER")
public class Driver extends User {

    @Column(nullable = false, unique = true, length = 20)
    private String nic;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private DriverVerificationStatus verificationStatus = DriverVerificationStatus.PENDING_VERIFICATION;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "total_trips")
    private Integer totalTrips = 0;

    @Column(name = "is_online", nullable = false)
    private boolean online = false;

    @Column(name = "commission_debt", nullable = false)
    private Double commissionDebt = 0.0;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @OneToOne(mappedBy = "driver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Vehicle vehicle;

    public Driver() {}

    // ── Getters ──────────────────────────────────────────────────────────────
    public String getNic() { return nic; }
    public String getLicenseNumber() { return licenseNumber; }
    public DriverVerificationStatus getVerificationStatus() { return verificationStatus; }
    public Double getAverageRating() { return averageRating; }
    public Integer getTotalTrips() { return totalTrips; }
    public boolean isOnline() { return online; }
    public Double getCommissionDebt() { return commissionDebt; }
    public Double getCurrentLat() { return currentLat; }
    public Double getCurrentLng() { return currentLng; }
    public Vehicle getVehicle() { return vehicle; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setNic(String nic) { this.nic = nic; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setVerificationStatus(DriverVerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public void setTotalTrips(Integer totalTrips) { this.totalTrips = totalTrips; }
    public void setOnline(boolean online) { this.online = online; }
    public void setCommissionDebt(Double commissionDebt) { this.commissionDebt = commissionDebt; }
    public void setCurrentLat(Double currentLat) { this.currentLat = currentLat; }
    public void setCurrentLng(Double currentLng) { this.currentLng = currentLng; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
}
