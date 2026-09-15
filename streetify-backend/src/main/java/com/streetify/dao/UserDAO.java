package com.streetify.dao;

import com.streetify.entity.User;
import com.streetify.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * UserDAO — Data Access Layer for User entities.
 *
 * Extends JpaRepository to provide:
 *   - Standard CRUD (save, findById, delete)
 *   - Custom explicit query methods documented below
 *
 * CRITICAL: All custom methods use Spring Data method names or @Query (JPQL).
 * NO manual JSON parsing is performed here.
 */
@Repository
public interface UserDAO extends JpaRepository<User, Long> {

    // ─── Lookup Methods ──────────────────────────────────────────────────────

    /**
     * Find user by email address (primary login identifier).
     * Used by AppUserDetailsService and AuthService.
     *
     * @param email the user's email
     * @return Optional<User> — empty if not found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user with the given email already exists.
     * Used during registration to prevent duplicate accounts.
     */
    boolean existsByEmail(String email);

    /**
     * Check if a phone number is already registered.
     */
    boolean existsByPhone(String phone);

    /**
     * Find all users with a specific role.
     * Admin use: list all drivers, all passengers, etc.
     */
    List<User> findByRole(UserRole role);

    /**
     * Find all active users with a specific role.
     */
    List<User> findByRoleAndActiveTrue(UserRole role);

    /**
     * Find all currently suspended users.
     * Admin use: suspension management dashboard.
     */
    @Query("SELECT u FROM User u WHERE u.suspended = true ORDER BY u.suspendedUntil DESC")
    List<User> findAllSuspendedUsers();

    /**
     * Find all users whose suspension has expired but are still flagged suspended.
     * Used by a scheduled task to auto-lift expired suspensions.
     */
    @Query("SELECT u FROM User u WHERE u.suspended = true AND u.suspendedUntil < :now")
    List<User> findUsersWithExpiredSuspension(@Param("now") LocalDateTime now);

    // ─── Update Methods ───────────────────────────────────────────────────────

    /**
     * Suspend a user account.
     * Sets suspended=true, suspendedUntil, and suspensionReason.
     *
     * @param userId          the user's database ID
     * @param suspendedUntil  the date/time suspension expires (null = permanent)
     * @param reason          reason string for audit trail
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE User u
           SET u.suspended = true,
               u.suspendedUntil = :suspendedUntil,
               u.suspensionReason = :reason,
               u.active = false
           WHERE u.id = :userId
           """)
    void suspendUser(
            @Param("userId") Long userId,
            @Param("suspendedUntil") LocalDateTime suspendedUntil,
            @Param("reason") String reason
    );

    /**
     * Lift a suspension from a user account.
     */
    @Modifying
    @Transactional
    @Query("""
           UPDATE User u
           SET u.suspended = false,
               u.suspendedUntil = null,
               u.suspensionReason = null,
               u.active = true
           WHERE u.id = :userId
           """)
    void unsuspendUser(@Param("userId") Long userId);

    /**
     * Credit an amount to the user's wallet balance.
     *
     * @param userId the user's database ID
     * @param amount the LKR amount to add
     */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.walletBalance = u.walletBalance + :amount WHERE u.id = :userId")
    void creditWallet(@Param("userId") Long userId, @Param("amount") Double amount);

    /**
     * Deduct an amount from the user's wallet balance.
     */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.walletBalance = u.walletBalance - :amount WHERE u.id = :userId")
    void debitWallet(@Param("userId") Long userId, @Param("amount") Double amount);
}
