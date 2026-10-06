package com.streetify.service.ride;

/**
 * RideTypeFactory — Factory Class (GoF Factory Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Factory (Creational)
 * Member    : Chanuka (IT25102207) — Ride Booking & Dispatch Engine
 * Role      : Factory Class (THE core class of this pattern)
 * ─────────────────────────────────────────────────────────────────
 *
 * Centralises the creation of RideTypeConfig objects based on
 * a ride type string. The client (DispatchService) calls this
 * factory and receives a RideTypeConfig — it never directly
 * instantiates TukRideConfig, StandardRideConfig, etc.
 *
 * BEFORE (problem — object creation scattered in DispatchService):
 *   private static final Map<String, double[]> FARE_CONFIG = Map.of(
 *       "tuk",      new double[]{120.0, 24.0},
 *       "standard", new double[]{200.0, 33.0},
 *       "xl",       new double[]{340.0, 48.0},
 *       "moto",     new double[]{80.0,  18.0}
 *   );
 *   // Usage: double[] rates = FARE_CONFIG.get(rideType.toLowerCase());
 *   // Problem: adding "premium" requires editing DispatchService directly
 *
 * AFTER (Factory Pattern — clean, extensible, decoupled):
 *   RideTypeConfig config = RideTypeFactory.create("standard");
 *   double baseFare  = config.getBaseFare();   // LKR 200
 *   double perKmRate = config.getPerKmRate();  // LKR 33
 *   // Adding "premium": only add PremiumRideConfig + one case here
 *
 * Lecture Reference (Lecture A, Slide 32-33):
 *   "Create a Factory Class — the factory chooses the correct
 *    concrete class to instantiate. Client code uses the factory,
 *    not the concrete classes."
 *
 * Advantages demonstrated (Lecture A, Slide 35):
 *   ✓ Hides object creation details
 *   ✓ Cleaner & more reusable DispatchService code
 *   ✓ Easy to extend with new ride types (Open/Closed Principle)
 *   ✓ Promotes loose coupling
 */
public class RideTypeFactory {

    // Private constructor — utility class, not meant to be instantiated
    private RideTypeFactory() {}

    /**
     * Creates and returns the correct RideTypeConfig for the given type.
     *
     * This is the core Factory method — the client calls this with a
     * type string and receives a fully configured product object back.
     * The client never calls "new TukRideConfig()" directly.
     *
     * @param rideType the ride type string from the booking request
     *                 (case-insensitive: "tuk", "standard", "xl", "moto")
     * @return the matching RideTypeConfig concrete implementation
     * @throws IllegalArgumentException if the ride type is not recognised
     */
    public static RideTypeConfig create(String rideType) {
        if (rideType == null || rideType.isBlank()) {
            throw new IllegalArgumentException(
                "Ride type must not be null or empty.");
        }

        return switch (rideType.toLowerCase().trim()) {
            case "tuk"      -> new TukRideConfig();
            case "standard" -> new StandardRideConfig();
            case "xl"       -> new XlRideConfig();
            case "moto"     -> new MotoRideConfig();
            default -> throw new IllegalArgumentException(
                "Unknown ride type: '" + rideType + "'. " +
                "Valid types: tuk, standard, xl, moto");
        };
    }

    /**
     * Checks whether a given ride type string is valid.
     * Useful for input validation before calling create().
     *
     * @param rideType the type string to check
     * @return true if the factory can create a config for this type
     */
    public static boolean isValidRideType(String rideType) {
        if (rideType == null) return false;
        return switch (rideType.toLowerCase().trim()) {
            case "tuk", "standard", "xl", "moto" -> true;
            default -> false;
        };
    }
}
