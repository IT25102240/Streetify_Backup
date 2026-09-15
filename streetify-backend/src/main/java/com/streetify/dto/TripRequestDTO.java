package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * TripRequestDTO — Request body for POST /api/trips/request (book a ride).
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class TripRequestDTO {

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotNull(message = "Pickup latitude is required")
    private Double pickupLat;

    @NotNull(message = "Pickup longitude is required")
    private Double pickupLng;

    @NotBlank(message = "Dropoff address is required")
    private String dropoffAddress;

    @NotNull(message = "Dropoff latitude is required")
    private Double dropoffLat;

    @NotNull(message = "Dropoff longitude is required")
    private Double dropoffLng;

    @NotBlank(message = "Ride type is required")
    private String rideType; // standard | xl | moto

    private String paymentMethod = "CASH"; // CASH | CARD | WALLET

    public TripRequestDTO() {}

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public Double getPickupLat() { return pickupLat; }
    public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }

    public Double getPickupLng() { return pickupLng; }
    public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }

    public String getDropoffAddress() { return dropoffAddress; }
    public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }

    public Double getDropoffLat() { return dropoffLat; }
    public void setDropoffLat(Double dropoffLat) { this.dropoffLat = dropoffLat; }

    public Double getDropoffLng() { return dropoffLng; }
    public void setDropoffLng(Double dropoffLng) { this.dropoffLng = dropoffLng; }

    public String getRideType() { return rideType; }
    public void setRideType(String rideType) { this.rideType = rideType; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
