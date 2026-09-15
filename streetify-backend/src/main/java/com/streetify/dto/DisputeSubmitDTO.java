package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DisputeSubmitDTO — Request body for POST /api/disputes/create
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class DisputeSubmitDTO {

    private Long tripId; // optional

    @NotBlank(message = "Subject is required")
    @Size(max = 200)
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(max = 2000)
    private String description;

    @NotBlank(message = "Dispute type is required")
    private String disputeType; // OVERCHARGE | NO_SHOW | DRIVER_BEHAVIOUR | OTHER

    private Double requestedRefundAmount; // optional

    public DisputeSubmitDTO() {}

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDisputeType() { return disputeType; }
    public void setDisputeType(String disputeType) { this.disputeType = disputeType; }

    public Double getRequestedRefundAmount() { return requestedRefundAmount; }
    public void setRequestedRefundAmount(Double requestedRefundAmount) { this.requestedRefundAmount = requestedRefundAmount; }
}
