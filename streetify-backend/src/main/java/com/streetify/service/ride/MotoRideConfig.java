package com.streetify.service.ride;

/**
 * MotoRideConfig — Concrete Product (GoF Factory Pattern)
 * Ride type: Motorbike | Base: LKR 80 | Per-km: LKR 18
 */
public class MotoRideConfig implements RideTypeConfig {
    @Override public String getRideType()     { return "moto"; }
    @Override public String getLabel()        { return "Motorbike"; }
    @Override public double getBaseFare()     { return 80.0; }
    @Override public double getPerKmRate()    { return 18.0; }
    @Override public int    getMaxPassengers(){ return 1; }
}
