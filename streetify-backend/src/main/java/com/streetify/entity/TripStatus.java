package com.streetify.entity;

/**
 * TripStatus — State machine for Streetify trip lifecycle.
 *
 * Matches Driver.tsx frontend TripState:
 *
 *   REQUESTED   → Passenger booked; broadcast via WS to nearby drivers
 *   ACCEPTED    → A driver accepted; assigned to passenger
 *   EN_ROUTE    → Driver navigating to pickup location
 *   ARRIVED     → Driver physically at pickup (5-min no-show timer starts)
 *   IN_PROGRESS → Passenger on board, trip underway
 *   COMPLETED   → Trip finished; payment triggered
 *   CANCELLED   → Cancelled by passenger or driver (penalty rules apply)
 */
public enum TripStatus {
    REQUESTED,
    ACCEPTED,
    EN_ROUTE,
    ARRIVED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
