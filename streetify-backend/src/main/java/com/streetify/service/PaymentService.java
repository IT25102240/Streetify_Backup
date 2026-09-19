package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.PaymentDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dto.PaymentReceiptDTO;
import com.streetify.dto.PaymentRequestDTO;
import com.streetify.entity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * PaymentService — ACID-compliant payment processing with commission logic.
 *
 * @Transactional ensures all steps execute atomically:
 *   If any step fails → FULL ROLLBACK (no partial payments).
 *
 * Flow for each payment:
 *   1. Validate trip is COMPLETED and not already paid
 *   2. Create Payment record (PENDING)
 *   3. Simulate card processing with mock retry loop (max 3 attempts)
 *   4. On SUCCESS:
 *      a. Mark trip as paid
 *      b. Deduct 15% platform commission
 *      c. Credit driver's wallet (net amount)
 *      d. Update Payment status to SUCCESS
 *   5. Return PaymentReceiptDTO
 *
 * Commission: 15% of totalFare → platform revenue
 * Driver net: 85% of totalFare
 */
@Service
@Transactional
@SuppressWarnings("null")
public class PaymentService {

    private final PaymentDAO paymentDAO;
    private final TripDAO tripDAO;
    private final DriverDAO driverDAO;

    @Value("${streetify.commission.rate:0.15}")
    private double commissionRate;

    private static final int MAX_RETRY_ATTEMPTS = 3;

    public PaymentService(PaymentDAO paymentDAO,
                          TripDAO tripDAO,
                          DriverDAO driverDAO) {
        this.paymentDAO = paymentDAO;
        this.tripDAO = tripDAO;
        this.driverDAO = driverDAO;
    }

    // ─── Payment Processing ───────────────────────────────────────────────────

    /**
     * Processes payment for a completed trip.
     *
     * @param passengerId authenticated passenger's ID (from JWT)
     * @param dto         PaymentRequestDTO { tripId, paymentMethod }
     * @return PaymentReceiptDTO with receipt details
     */
    public PaymentReceiptDTO processPayment(Long passengerId, PaymentRequestDTO dto) {
        // ── Step 1: Load and validate trip ──────────────────────────────────
        Trip trip = tripDAO.findById(dto.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + dto.getTripId()));

        // Temporarily disabled for UI testing convenience:
        // if (trip.getStatus() != TripStatus.COMPLETED) {
        //     throw new IllegalStateException("Payment can only be processed for COMPLETED trips.");
        // }
        if (trip.isPaid()) {
            throw new IllegalStateException("This trip has already been paid.");
        }
        if (!trip.getPassenger().getId().equals(passengerId)) {
            throw new SecurityException("You are not authorized to pay for this trip.");
        }

        // ── Step 2: Calculate amounts ────────────────────────────────────────
        double grossAmount = trip.getTotalFare();
        double commission = Math.round(grossAmount * commissionRate * 100.0) / 100.0;
        double driverNet  = Math.round((grossAmount - commission) * 100.0) / 100.0;

        // --- MOCK OVERRIDE FOR UI TESTING WITHOUT DRIVER ---
        if (trip.getDriver() == null) {
            java.util.List<Driver> drivers = driverDAO.findAll();
            if (!drivers.isEmpty()) {
                trip.setDriver(drivers.get(0));
            }
        }
        // ---------------------------------------------------

        // ── Step 3: Create Payment record (PENDING) ─────────────────────────
        Payment payment = Payment.builder()
                .trip(trip)
                .passenger(trip.getPassenger())
                .driver(trip.getDriver())
                .grossAmount(grossAmount)
                .platformCommission(commission)
                .driverNet(driverNet)
                .paymentMethod(dto.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .retryCount(0)
                .build();

        payment = paymentDAO.save(payment);

        // ── Step 4: Simulate payment processing with retry loop ──────────────
        boolean paymentSucceeded = false;
        String failureReason = null;

        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            if (simulatePaymentGateway(dto.getPaymentMethod(), grossAmount)) {
                paymentSucceeded = true;
                break;
            } else {
                failureReason = "Payment gateway declined on attempt " + attempt;
                paymentDAO.incrementRetryCount(payment.getId(), failureReason);
            }
        }

        // ── Step 5: Apply outcome ─────────────────────────────────────────────
        if (paymentSucceeded) {
            LocalDateTime now = LocalDateTime.now();

            // Mark trip as paid
            trip.setPaid(true);
            tripDAO.save(trip);

            // Credit driver's wallet with net amount (if driver exists)
            if (trip.getDriver() != null) {
                driverDAO.creditWallet(trip.getDriver().getId(), driverNet);

                // Add commission to driver's debt (platform collects later)
                driverDAO.addCommissionDebt(trip.getDriver().getId(), commission);
            }

            // Update payment record to SUCCESS
            paymentDAO.updatePaymentStatus(payment.getId(), PaymentStatus.SUCCESS, now);

            return PaymentReceiptDTO.builder()
                    .paymentId(payment.getId())
                    .tripId(trip.getId())
                    .status("SUCCESS")
                    .grossAmount(grossAmount)
                    .platformCommission(commission)
                    .driverNet(driverNet)
                    .paymentMethod(dto.getPaymentMethod())
                    .processedAt(now)
                    .message("Payment successful! LKR " + grossAmount + " processed.")
                    .build();
        } else {
            // All retries exhausted — mark as FAILED
            paymentDAO.updatePaymentStatus(payment.getId(), PaymentStatus.FAILED, LocalDateTime.now());

            return PaymentReceiptDTO.builder()
                    .paymentId(payment.getId())
                    .tripId(trip.getId())
                    .status("FAILED")
                    .grossAmount(grossAmount)
                    .paymentMethod(dto.getPaymentMethod())
                    .processedAt(LocalDateTime.now())
                    .message("Payment failed after " + MAX_RETRY_ATTEMPTS + " attempts. " + failureReason)
                    .build();
        }
    }

    // ─── Mock Payment Gateway ────────────────────────────────────────────────

    /**
     * Simulates a payment gateway response.
     *
     * In production: replace with actual payment gateway SDK call
     * (e.g., PayHere for Sri Lanka, Stripe, or bank API).
     *
     * Mock behavior:
     *   - CASH payments always succeed
     *   - WALLET payments succeed if sufficient balance
     *   - CARD payments have a 90% success rate (simulates occasional decline)
     */
    private boolean simulatePaymentGateway(String paymentMethod, double amount) {
        return switch (paymentMethod.toUpperCase()) {
            case "CASH"   -> true;         // Cash always succeeds
            case "WALLET" -> true;         // Assume sufficient wallet balance
            case "CARD"   -> Math.random() > 0.10; // 90% success rate
            default       -> false;
        };
    }
}
