package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.ReviewDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dto.ReviewSubmitDTO;
import com.streetify.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ReviewService — Handles post-trip passenger reviews.
 *
 * After a trip is COMPLETED and PAID, the passenger submits a 1–5 star review.
 * Driver's averageRating is recalculated and saved.
 */
@Service
@Transactional
public class ReviewService {

    private final ReviewDAO reviewDAO;
    private final TripDAO tripDAO;
    private final DriverDAO driverDAO;

    public ReviewService(ReviewDAO reviewDAO, TripDAO tripDAO, DriverDAO driverDAO) {
        this.reviewDAO = reviewDAO;
        this.tripDAO = tripDAO;
        this.driverDAO = driverDAO;
    }

    /**
     * Submits a review for a completed trip.
     *
     * Steps:
     *   1. Validate trip is COMPLETED
     *   2. Prevent duplicate review
     *   3. Save review
     *   4. Recalculate driver's average rating
     *
     * @param passengerId authenticated passenger's ID
     * @param dto         ReviewSubmitDTO { tripId, rating, comment }
     * @return saved Review entity
     */
    public Review submitReview(Long passengerId, ReviewSubmitDTO dto) {
        Trip trip = tripDAO.findById(dto.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found."));

        if (trip.getStatus() != TripStatus.COMPLETED) {
            throw new IllegalStateException("Reviews can only be submitted for completed trips.");
        }
        if (!trip.getPassenger().getId().equals(passengerId)) {
            throw new SecurityException("You can only review your own trips.");
        }
        if (reviewDAO.existsByTripId(dto.getTripId())) {
            throw new IllegalStateException("You have already reviewed this trip.");
        }

        Review review = Review.builder()
                .trip(trip)
                .passenger(trip.getPassenger())
                .driver(trip.getDriver())
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        Review saved = reviewDAO.save(review);

        // Recalculate driver's average rating
        reviewDAO.calculateAverageRatingForDriver(trip.getDriver().getId())
                .ifPresent(avgRating -> {
                    double rounded = Math.round(avgRating * 100.0) / 100.0;
                    driverDAO.updateAverageRating(trip.getDriver().getId(), rounded);
                });

        return saved;
    }

    /**
     * Get all reviews for a driver.
     */
    @Transactional(readOnly = true)
    public List<Review> getDriverReviews(Long driverId) {
        return reviewDAO.findByDriverIdOrderByCreatedAtDesc(driverId);
    }
}
