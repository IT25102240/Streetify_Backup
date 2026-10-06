package com.streetify.service.ride;

/**
 * RideTypeConfig — Product Interface (GoF Factory Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Factory (Creational)
 * Member    : Chanuka (IT25102207) — Ride Booking & Dispatch Engine
 * Role      : Product Interface — common type returned by the factory
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the common interface that all ride type configurations
 * must implement. The client (DispatchService) only works with
 * this interface — it never depends on the concrete ride classes.
 *
 * BEFORE (problem — DispatchService hard-codes all ride rates):
 *   private static final Map<String, double[]> FARE_CONFIG = Map.of(
 *       "tuk",      new double[]{120.0, 24.0},
 *       "standard", new double[]{200.0, 33.0},
 *       ...
 *   );
 *
 * AFTER (Factory Pattern — DispatchService calls factory only):
 *   RideTypeConfig config = RideTypeFactory.create("standard");
 *   double base = config.getBaseFare();    // uses this interface
 *
 * Lecture Reference (Lecture A, Slide 30):
 *   "Defines Common Interface" — all concrete products implement
 *   the same interface so the factory can return any of them
 *   interchangeably.
 *
 * Concrete implementations (Chanuka creates):
 *   → TukRideConfig      (tuk-tuk: base=120, perKm=24)
 *   → StandardRideConfig (car: base=200, perKm=33)
 *   → XlRideConfig       (SUV: base=340, perKm=48)
 *   → MotoRideConfig     (motorbike: base=80, perKm=18)
 */
public interface RideTypeConfig {

    /**
     * @return the internal ride type key (e.g. "tuk", "standard")
     */
    String getRideType();

    /**
     * @return the human-readable label shown in the UI
     *         (e.g. "Tuk-Tuk", "Standard Car")
     */
    String getLabel();

    /**
     * @return the base fare in LKR charged for every trip of this type
     *         regardless of distance
     */
    double getBaseFare();

    /**
     * @return the per-kilometre charge in LKR added on top of base fare
     */
    double getPerKmRate();

    /**
     * @return the maximum passenger capacity for this ride type
     */
    int getMaxPassengers();
}
