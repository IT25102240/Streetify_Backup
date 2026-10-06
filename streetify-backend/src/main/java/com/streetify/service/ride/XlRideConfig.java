package com.streetify.service.ride;

/**
 * XlRideConfig — Concrete Product (GoF Factory Pattern)
 * Ride type: XL / SUV | Base: LKR 340 | Per-km: LKR 48
 */
public class XlRideConfig implements RideTypeConfig {
    @Override public String getRideType()     { return "xl"; }
    @Override public String getLabel()        { return "XL / SUV"; }
    @Override public double getBaseFare()     { return 340.0; }
    @Override public double getPerKmRate()    { return 48.0; }
    @Override public int    getMaxPassengers(){ return 6; }
}
