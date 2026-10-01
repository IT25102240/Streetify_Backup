package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.PaymentDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dao.UserDAO;
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
 *   1. Validate trip is not already paid and caller is authorized
 *   2. If WALLET payment, ensure passenger has sufficient wallet balance
 *   3. Create Payment record (PENDING)
 *   4. Simulate payment gateway processing
 *   5. On SUCCESS:
 *      a. Mark trip as paid
 *      b. If WALLET: debit passenger wallet, credit driver wallet net amount (85%)
 *      c. If CASH: driver already has physical cash; add 15% platform commission debt to driver
 *      d. If CARD: credit driver wallet net amount (85%); platform keeps commission
 *      e. Update Payment status to SUCCESS
 *   6. Return PaymentReceiptDTO
 */
@Service
@Transactional
@SuppressWarnings("null")
public class PaymentService {

    private final PaymentDAO paymentDAO;
    private final TripDAO tripDAO;
    private final DriverDAO driverDAO;
    private final UserDAO userDAO;

    @Value("${streetify.commission.rate:0.15}")
    private double commissionRate;

    private static final int MAX_RETRY_ATTEMPTS = 3;

    public PaymentService(PaymentDAO paymentDAO,
                          TripDAO tripDAO,
                          DriverDAO driverDAO,
                          UserDAO userDAO) {
        this.paymentDAO = paymentDAO;
        this.tripDAO = tripDAO;
        this.driverDAO = driverDAO;
        this.userDAO = userDAO;
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

        String method = dto.getPaymentMethod().toUpperCase();

        // Validate wallet balance if paying via digital wallet
        User passenger = userDAO.findById(passengerId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger user account not found."));

        if ("WALLET".equals(method)) {
            double currentBalance = passenger.getWalletBalance() != null ? passenger.getWalletBalance() : 0.0;
            if (currentBalance < grossAmount) {
                throw new IllegalStateException("Insufficient wallet balance (Current: LKR " +
                        String.format("%.2f", currentBalance) + ", Required: LKR " +
                        String.format("%.2f", grossAmount) + "). Please top up your wallet or pay via Cash/Card.");
            }
        }

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

            // Apply financial settlement based on payment method:
            if (trip.getDriver() != null) {
                Long driverId = trip.getDriver().getId();
                if ("CASH".equals(method)) {
                    // Driver physically collected 100% of cash from passenger.
                    // Driver does NOT get credited with driverNet (already holds it).
                    // Driver owes 15% platform commission to Streetify:
                    driverDAO.addCommissionDebt(driverId, commission);
                } else if ("WALLET".equals(method)) {
                    // Digital wallet: passenger pays from wallet balance
                    userDAO.debitWallet(passengerId, grossAmount);
                    // Platform transfers 85% net earnings directly to driver's digital wallet:
                    driverDAO.creditWallet(driverId, driverNet);
                } else if ("CARD".equals(method)) {
                    // Online Card: Platform collected funds via 3DS card gateway
                    // Platform transfers 85% net earnings to driver's digital wallet:
                    driverDAO.creditWallet(driverId, driverNet);
                }
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
