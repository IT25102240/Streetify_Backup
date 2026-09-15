package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DisputeResolveDTO — Request body for PUT /api/disputes/{id}/resolve
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class DisputeResolveDTO {

    @NotBlank(message = "Resolution decision is required")
    private String decision; // RESOLVED | REJECTED

    @NotBlank(message = "Resolution note is required")
    private String resolutionNote;

    private Double approvedRefundAmount; // 0.0 if no refund approved

    public DisputeResolveDTO() {}

    public DisputeResolveDTO(String decision, String resolutionNote, Double approvedRefundAmount) {
        this.decision = decision;
        this.resolutionNote = resolutionNote;
        this.approvedRefundAmount = approvedRefundAmount;
    }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public Double getApprovedRefundAmount() { return approvedRefundAmount; }
    public void setApprovedRefundAmount(Double approvedRefundAmount) { this.approvedRefundAmount = approvedRefundAmount; }
}
