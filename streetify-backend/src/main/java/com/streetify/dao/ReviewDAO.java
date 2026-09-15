package com.streetify.dao;

import com.streetify.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ReviewDAO — Data Access Layer for Review entities.
 */
@Repository
public interface ReviewDAO extends JpaRepository<Review, Long> {

    /**
     * Find the review for a specific trip.
     */
    Optional<Review> findByTripId(Long tripId);

    /**
     * Check if a review already exists for a trip (prevent duplicate submissions).
     */
    boolean existsByTripId(Long tripId);

    /**
     * Find all reviews for a specific driver (for rating display).
     */
    List<Review> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    /**
     * Find all reviews submitted by a specific passenger.
     */
    List<Review> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);

    /**
     * Calculate a driver's average rating across all reviews.
     * Used to update Driver.averageRating after each new review.
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.driver.id = :driverId")
    Optional<Double> calculateAverageRatingForDriver(@Param("driverId") Long driverId);
}
