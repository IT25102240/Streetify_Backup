package com.streetify.entity;

/**
 * DriverVerificationStatus — Lifecycle states for driver onboarding.
 *
 * PENDING_VERIFICATION → Driver registered, documents submitted, awaiting STAFF review
 * APPROVED             → STAFF verified all 3 documents — driver can accept trips
 * REJECTED             → STAFF rejected documents — driver must resubmit
 * SUSPENDED            → ADMIN suspended — cannot login or accept trips
 */
public enum DriverVerificationStatus {
    PENDING_VERIFICATION,
    APPROVED,
    REJECTED,
    SUSPENDED
}
