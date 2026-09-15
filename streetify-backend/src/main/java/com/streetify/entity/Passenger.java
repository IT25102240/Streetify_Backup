package com.streetify.entity;

import jakarta.persistence.*;

/**
 * Passenger — Extends User for passenger-specific attributes.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@DiscriminatorValue("PASSENGER")
public class Passenger extends User {

    @Column(name = "average_rating")
    private Double averageRating = 5.0;

    @Column(name = "total_trips")
    private Integer totalTrips = 0;

    @Column(name = "preferred_payment_method", length = 50)
    private String preferredPaymentMethod = "CASH";

    public Passenger() {}

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Integer getTotalTrips() { return totalTrips; }
    public void setTotalTrips(Integer totalTrips) { this.totalTrips = totalTrips; }

    public String getPreferredPaymentMethod() { return preferredPaymentMethod; }
    public void setPreferredPaymentMethod(String preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; }
}
