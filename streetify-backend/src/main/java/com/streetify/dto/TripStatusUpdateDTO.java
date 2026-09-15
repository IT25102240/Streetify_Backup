package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * TripStatusUpdateDTO — Request body for PUT /api/trips/{id}/status
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class TripStatusUpdateDTO {

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotBlank(message = "Status is required")
    private String status; // EN_ROUTE | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED

    private String cancellationReason;

    public TripStatusUpdateDTO() {}

    public TripStatusUpdateDTO(Long tripId, String status, String cancellationReason) {
        this.tripId = tripId;
        this.status = status;
        this.cancellationReason = cancellationReason;
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
}
