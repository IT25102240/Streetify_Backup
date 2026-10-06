package com.streetify.service.ride;

/**
 * StandardRideConfig — Concrete Product (GoF Factory Pattern)
 * Ride type: Standard Car | Base: LKR 200 | Per-km: LKR 33
 */
public class StandardRideConfig implements RideTypeConfig {
    @Override public String getRideType()     { return "standard"; }
    @Override public String getLabel()        { return "Standard Car"; }
    @Override public double getBaseFare()     { return 200.0; }
    @Override public double getPerKmRate()    { return 33.0; }
    @Override public int    getMaxPassengers(){ return 4; }
}
