package com.streetify.dto;

/**
 * TripResponseDTO — Response for POST /api/rides/book
 * Plain Java with manual Builder (no Lombok — Java 24 compatibility).
 */
public class TripResponseDTO {

    private Long tripId;
    private String status;

    // Driver info (populated after dispatch)
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehiclePlate;
    private String vehicleType;
    private Double driverRating;
    private Integer etaMinutes;

    // Fare
    private Double totalFare;
    private String currency = "LKR";

    private String message;

    public TripResponseDTO() {}

    public TripResponseDTO(Long tripId, String status, Long driverId, String driverName,
                           String driverPhone, String vehiclePlate, String vehicleType,
                           Double driverRating, Integer etaMinutes, Double totalFare,
                           String currency, String message) {
        this.tripId = tripId;
        this.status = status;
        this.driverId = driverId;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.vehiclePlate = vehiclePlate;
        this.vehicleType = vehicleType;
        this.driverRating = driverRating;
        this.etaMinutes = etaMinutes;
        this.totalFare = totalFare;
        this.currency = currency != null ? currency : "LKR";
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long tripId;
        private String status;
        private Long driverId;
        private String driverName;
        private String driverPhone;
        private String vehiclePlate;
        private String vehicleType;
        private Double driverRating;
        private Integer etaMinutes;
        private Double totalFare;
        private String currency = "LKR";
        private String message;

        public Builder tripId(Long tripId) { this.tripId = tripId; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder driverId(Long driverId) { this.driverId = driverId; return this; }
        public Builder driverName(String driverName) { this.driverName = driverName; return this; }
        public Builder driverPhone(String driverPhone) { this.driverPhone = driverPhone; return this; }
        public Builder vehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; return this; }
        public Builder vehicleType(String vehicleType) { this.vehicleType = vehicleType; return this; }
        public Builder driverRating(Double driverRating) { this.driverRating = driverRating; return this; }
        public Builder etaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; return this; }
        public Builder totalFare(Double totalFare) { this.totalFare = totalFare; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }
        public Builder message(String message) { this.message = message; return this; }

        public TripResponseDTO build() {
            return new TripResponseDTO(tripId, status, driverId, driverName, driverPhone, vehiclePlate, vehicleType, driverRating, etaMinutes, totalFare, currency, message);
        }
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }

    public String getVehiclePlate() { return vehiclePlate; }
    public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public Double getDriverRating() { return driverRating; }
    public void setDriverRating(Double driverRating) { this.driverRating = driverRating; }

    public Integer getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

    public Double getTotalFare() { return totalFare; }
    public void setTotalFare(Double totalFare) { this.totalFare = totalFare; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
