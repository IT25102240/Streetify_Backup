package com.streetify.entity;

/**
 * UserRole — RBAC role enum for all Streetify platform users.
 *
 * Maps to Spring Security GrantedAuthority as "ROLE_<name>".
 *
 * PASSENGER → Books rides, makes payments, submits reviews/disputes
 * DRIVER    → Accepts trips, updates status, receives payments
 * STAFF     → Reviews driver documents, handles support tickets
 * ADMIN     → Full system access, suspensions, audit logs, JWT revocation
 */
public enum UserRole {
    PASSENGER,
    DRIVER,
    STAFF,
    ADMIN
}
