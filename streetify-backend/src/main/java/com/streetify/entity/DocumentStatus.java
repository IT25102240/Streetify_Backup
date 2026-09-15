package com.streetify.entity;

/**
 * DocumentStatus — Review lifecycle for uploaded driver documents.
 *
 * PENDING  → Just uploaded, awaiting STAFF review
 * APPROVED → STAFF verified the document
 * REJECTED → STAFF rejected (see reviewerNote for reason)
 */
public enum DocumentStatus {
    PENDING,
    APPROVED,
    REJECTED
}
