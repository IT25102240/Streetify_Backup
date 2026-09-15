package com.streetify.dto;

/**
 * FareEstimateDTO — Response for POST /api/rides/estimate
 * Plain Java with manual Builder (no Lombok — Java 24 compatibility).
 */
public class FareEstimateDTO {

    private String rideType;
    private Double distanceKm;
    private Integer estimatedDurationMinutes;

    // LKR Fare Breakdown
    private Double baseFare;
    private Double perKmRate;
    private Double distanceCharge;
    private Double platformFee;
    private Double totalFare;

    private String currency = "LKR";

    public FareEstimateDTO() {}

    public FareEstimateDTO(String rideType, Double distanceKm, Integer estimatedDurationMinutes,
                           Double baseFare, Double perKmRate, Double distanceCharge,
                           Double platformFee, Double totalFare, String currency) {
        this.rideType = rideType;
        this.distanceKm = distanceKm;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
        this.baseFare = baseFare;
        this.perKmRate = perKmRate;
        this.distanceCharge = distanceCharge;
        this.platformFee = platformFee;
        this.totalFare = totalFare;
        this.currency = currency != null ? currency : "LKR";
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String rideType;
        private Double distanceKm;
        private Integer estimatedDurationMinutes;
        private Double baseFare;
        private Double perKmRate;
        private Double distanceCharge;
        private Double platformFee;
        private Double totalFare;
        private String currency = "LKR";

        public Builder rideType(String rideType) { this.rideType = rideType; return this; }
        public Builder distanceKm(Double distanceKm) { this.distanceKm = distanceKm; return this; }
        public Builder estimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; return this; }
        public Builder baseFare(Double baseFare) { this.baseFare = baseFare; return this; }
        public Builder perKmRate(Double perKmRate) { this.perKmRate = perKmRate; return this; }
        public Builder distanceCharge(Double distanceCharge) { this.distanceCharge = distanceCharge; return this; }
        public Builder platformFee(Double platformFee) { this.platformFee = platformFee; return this; }
        public Builder totalFare(Double totalFare) { this.totalFare = totalFare; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }

        public FareEstimateDTO build() {
            return new FareEstimateDTO(rideType, distanceKm, estimatedDurationMinutes, baseFare, perKmRate, distanceCharge, platformFee, totalFare, currency);
        }
    }

    public String getRideType() { return rideType; }
    public void setRideType(String rideType) { this.rideType = rideType; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }

    public Double getBaseFare() { return baseFare; }
    public void setBaseFare(Double baseFare) { this.baseFare = baseFare; }

    public Double getPerKmRate() { return perKmRate; }
    public void setPerKmRate(Double perKmRate) { this.perKmRate = perKmRate; }

    public Double getDistanceCharge() { return distanceCharge; }
    public void setDistanceCharge(Double distanceCharge) { this.distanceCharge = distanceCharge; }

    public Double getPlatformFee() { return platformFee; }
    public void setPlatformFee(Double platformFee) { this.platformFee = platformFee; }

    public Double getTotalFare() { return totalFare; }
    public void setTotalFare(Double totalFare) { this.totalFare = totalFare; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
