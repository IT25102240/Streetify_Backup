package com.streetify.dao;

import com.streetify.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * VehicleDAO — Data Access Layer for Vehicle entities.
 */
@Repository
public interface VehicleDAO extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByDriverId(Long driverId);

    boolean existsByNumberPlate(String numberPlate);
}
