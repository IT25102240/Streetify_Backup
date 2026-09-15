package com.streetify.dto;

import jakarta.validation.constraints.*;

/**
 * ReviewSubmitDTO — Request body for POST /api/reviews
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class ReviewSubmitDTO {

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String comment;

    public ReviewSubmitDTO() {}

    public ReviewSubmitDTO(Long tripId, Integer rating, String comment) {
        this.tripId = tripId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
