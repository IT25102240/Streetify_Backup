package com.streetify.dto;

import com.streetify.entity.Review;
import java.time.LocalDateTime;

/**
 * ReviewResponseDTO — Response body for Review endpoints.
 * Prevents LazyInitializationException from returning Review entity directly.
 */
public class ReviewResponseDTO {

    private Long id;
    private Long tripId;
    private Long passengerId;
    private Long driverId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewResponseDTO() {}

    public ReviewResponseDTO(Review review) {
        this.id = review.getId();
        this.tripId = review.getTrip() != null ? review.getTrip().getId() : null;
        this.passengerId = review.getPassenger() != null ? review.getPassenger().getId() : null;
        this.driverId = review.getDriver() != null ? review.getDriver().getId() : null;
        this.rating = review.getRating();
        this.comment = review.getComment();
        this.createdAt = review.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Long getPassengerId() { return passengerId; }
    public void setPassengerId(Long passengerId) { this.passengerId = passengerId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
