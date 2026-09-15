package com.streetify.entity;

/**
 * PaymentStatus — Lifecycle states for a Streetify payment transaction.
 */
public enum PaymentStatus {
    PENDING,    // Created but not yet processed
    SUCCESS,    // Payment completed successfully
    FAILED,     // Payment declined (retry logic applied)
    REFUNDED    // Admin approved refund
}
