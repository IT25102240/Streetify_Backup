package com.streetify.dao;

import com.streetify.entity.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * PassengerDAO — Data Access Layer for Passenger entities.
 */
@Repository
public interface PassengerDAO extends JpaRepository<Passenger, Long> {

    Optional<Passenger> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Increment the passenger's total trips counter after a completed trip.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Passenger p SET p.totalTrips = p.totalTrips + 1 WHERE p.id = :passengerId")
    void incrementTotalTrips(@Param("passengerId") Long passengerId);

    /**
     * Update the passenger's average rating (rated by drivers).
     */
    @Modifying
    @Transactional
    @Query("UPDATE Passenger p SET p.averageRating = :rating WHERE p.id = :passengerId")
    void updateAverageRating(@Param("passengerId") Long passengerId, @Param("rating") Double rating);
}
