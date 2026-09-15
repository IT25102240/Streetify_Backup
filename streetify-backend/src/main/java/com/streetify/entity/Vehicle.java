package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Vehicle — stores vehicle information linked to a Driver.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false, unique = true)
    private Driver driver;

    @Column(name = "vehicle_type", nullable = false, length = 20)
    private String vehicleType;

    @Column(name = "number_plate", nullable = false, unique = true, length = 20)
    private String numberPlate;

    @Column(name = "year_of_manufacture", nullable = false)
    private Integer yearOfManufacture;

    @Column(length = 100)
    private String make;

    @Column(length = 100)
    private String model;

    @Column(length = 20)
    private String color;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Vehicle() {}

    // Builder-style constructor used in AuthService
    public static VehicleBuilder builder() { return new VehicleBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Driver getDriver() { return driver; }
    public String getVehicleType() { return vehicleType; }
    public String getNumberPlate() { return numberPlate; }
    public Integer getYearOfManufacture() { return yearOfManufacture; }
    public String getMake() { return make; }
    public String getModel() { return model; }
    public String getColor() { return color; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public void setNumberPlate(String numberPlate) { this.numberPlate = numberPlate; }
    public void setYearOfManufacture(Integer yearOfManufacture) { this.yearOfManufacture = yearOfManufacture; }
    public void setMake(String make) { this.make = make; }
    public void setModel(String model) { this.model = model; }
    public void setColor(String color) { this.color = color; }

    // ── Manual Builder ────────────────────────────────────────────────────────
    public static class VehicleBuilder {
        private final Vehicle v = new Vehicle();
        public VehicleBuilder driver(Driver d) { v.driver = d; return this; }
        public VehicleBuilder vehicleType(String t) { v.vehicleType = t; return this; }
        public VehicleBuilder numberPlate(String p) { v.numberPlate = p; return this; }
        public VehicleBuilder yearOfManufacture(Integer y) { v.yearOfManufacture = y; return this; }
        public VehicleBuilder make(String m) { v.make = m; return this; }
        public VehicleBuilder model(String m) { v.model = m; return this; }
        public VehicleBuilder color(String c) { v.color = c; return this; }
        public Vehicle build() { return v; }
    }
}
