package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * SuspendUserDTO — Request body for POST /api/admin/suspend
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class SuspendUserDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Suspension duration is required")
    private String duration; // "1" | "3" | "7" | "30" | "permanent" (days)

    @NotBlank(message = "Audit note is required — this is permanent and immutable")
    @Size(max = 300, message = "Audit note cannot exceed 300 characters")
    private String auditNote;

    public SuspendUserDTO() {}

    public SuspendUserDTO(Long userId, String duration, String auditNote) {
        this.userId = userId;
        this.duration = duration;
        this.auditNote = auditNote;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getAuditNote() { return auditNote; }
    public void setAuditNote(String auditNote) { this.auditNote = auditNote; }
}
