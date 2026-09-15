package com.streetify.dto;

/**
 * TelemetryDTO — WebSocket message for live GPS tracking.
 * Plain Java with manual Builder (no Lombok — Java 24 compatibility).
 */
public class TelemetryDTO {

    private Long driverId;
    private Long tripId;        // null if driver is idle/waiting
    private Double lat;
    private Double lng;
    private Double heading;     // degrees 0-360
    private Double speedKmh;
    private Integer etaMinutes; // estimated minutes to pickup/dropoff
    private String tripStatus;  // current trip state

    public TelemetryDTO() {}

    public TelemetryDTO(Long driverId, Long tripId, Double lat, Double lng, Double heading,
                        Double speedKmh, Integer etaMinutes, String tripStatus) {
        this.driverId = driverId;
        this.tripId = tripId;
        this.lat = lat;
        this.lng = lng;
        this.heading = heading;
        this.speedKmh = speedKmh;
        this.etaMinutes = etaMinutes;
        this.tripStatus = tripStatus;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long driverId;
        private Long tripId;
        private Double lat;
        private Double lng;
        private Double heading;
        private Double speedKmh;
        private Integer etaMinutes;
        private String tripStatus;

        public Builder driverId(Long driverId) { this.driverId = driverId; return this; }
        public Builder tripId(Long tripId) { this.tripId = tripId; return this; }
        public Builder lat(Double lat) { this.lat = lat; return this; }
        public Builder lng(Double lng) { this.lng = lng; return this; }
        public Builder heading(Double heading) { this.heading = heading; return this; }
        public Builder speedKmh(Double speedKmh) { this.speedKmh = speedKmh; return this; }
        public Builder etaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; return this; }
        public Builder tripStatus(String tripStatus) { this.tripStatus = tripStatus; return this; }

        public TelemetryDTO build() {
            return new TelemetryDTO(driverId, tripId, lat, lng, heading, speedKmh, etaMinutes, tripStatus);
        }
    }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getHeading() { return heading; }
    public void setHeading(Double heading) { this.heading = heading; }

    public Double getSpeedKmh() { return speedKmh; }
    public void setSpeedKmh(Double speedKmh) { this.speedKmh = speedKmh; }

    public Integer getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

    public String getTripStatus() { return tripStatus; }
    public void setTripStatus(String tripStatus) { this.tripStatus = tripStatus; }
}
