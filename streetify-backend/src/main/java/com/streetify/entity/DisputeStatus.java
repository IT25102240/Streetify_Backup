package com.streetify.entity;

/**
 * DisputeStatus — Lifecycle states for a Streetify support ticket.
 */
public enum DisputeStatus {
    OPEN,          // Submitted by passenger
    UNDER_REVIEW,  // Being investigated by STAFF
    RESOLVED,      // Resolved (refund approved or denied)
    REJECTED       // Rejected by STAFF (no violation found)
}
