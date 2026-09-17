package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * User — Base @Entity for all Streetify platform users.
 * SINGLE_TABLE inheritance. Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true)
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("USER")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean suspended = false;

    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    /**
     * adminRole — Scopes which CRUD module this ADMIN user manages.
     * Values: SUPER_ADMIN, USER_MGMT, BOOKING_MGMT, DRIVER_MGMT, PAYMENT_MGMT, REVIEW_MGMT
     * Null for non-admin roles.
     */
    @Column(name = "admin_role", length = 30)
    private String adminRole;

    @Column(name = "wallet_balance", nullable = false)
    private Double walletBalance = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public User() {}

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getEmail() { return email; }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getPasswordHash() { return passwordHash; }
    public UserRole getRole() { return role; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhone() { return phone; }
    public boolean isActive() { return active; }
    public boolean isSuspended() { return suspended; }
    public LocalDateTime getSuspendedUntil() { return suspendedUntil; }
    public String getSuspensionReason() { return suspensionReason; }
    public Double getWalletBalance() { return walletBalance; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getFullName() { return firstName + " " + lastName; }
    public String getAdminRole() { return adminRole; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRole(UserRole role) { this.role = role; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setActive(boolean active) { this.active = active; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }
    public void setSuspendedUntil(LocalDateTime suspendedUntil) { this.suspendedUntil = suspendedUntil; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }
    public void setWalletBalance(Double walletBalance) { this.walletBalance = walletBalance; }
    public void setAdminRole(String adminRole) { this.adminRole = adminRole; }
}
