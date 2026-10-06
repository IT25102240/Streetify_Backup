package com.streetify.service.ride;

/**
 * TukRideConfig — Concrete Product (GoF Factory Pattern)
 * Ride type: Tuk-Tuk | Base: LKR 120 | Per-km: LKR 24
 */
public class TukRideConfig implements RideTypeConfig {
    @Override public String getRideType()     { return "tuk"; }
    @Override public String getLabel()        { return "Tuk-Tuk"; }
    @Override public double getBaseFare()     { return 120.0; }
    @Override public double getPerKmRate()    { return 24.0; }
    @Override public int    getMaxPassengers(){ return 3; }
}
