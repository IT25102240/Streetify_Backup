package com.streetify.service.payment;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.UserDAO;

/**
 * PaymentStrategyFactory — Strategy Resolver (GoF Strategy Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Strategy (Behavioral)
 * Member    : Daham (IT25102225) — Payment & Ledger Management
 * Role      : Strategy Factory — selects and returns the correct strategy
 * ─────────────────────────────────────────────────────────────────
 *
 * This utility class resolves which PaymentSettlementStrategy to use
 * based on the payment method string from the booking request.
 *
 * The Context (PaymentService) calls this factory to get the correct
 * strategy, then delegates to it — it never contains payment-method
 * logic itself.
 *
 * Lecture Reference (Lecture A, Slide 20 — Client code):
 *   "The end-user code or the application logic that selects which
 *    strategy should be applied."
 *
 * Usage in PaymentService:
 *   PaymentSettlementStrategy strategy =
 *       PaymentStrategyFactory.resolve(method, userDAO, driverDAO);
 *   strategy.settle(passengerId, driverId, grossAmount, commission, driverNet);
 */
public class PaymentStrategyFactory {

    // Utility class — not instantiated
    private PaymentStrategyFactory() {}

    /**
     * Resolves and returns the correct PaymentSettlementStrategy
     * for the given payment method string.
     *
     * @param paymentMethod the payment method from the booking request
     *                      (case-insensitive: "CASH", "WALLET", "CARD")
     * @param userDAO       injected by the caller (PaymentService)
     * @param driverDAO     injected by the caller (PaymentService)
     * @return the matching concrete strategy implementation
     * @throws IllegalArgumentException if the payment method is unrecognised
     */
    public static PaymentSettlementStrategy resolve(String paymentMethod,
                                                    UserDAO userDAO,
                                                    DriverDAO driverDAO) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new IllegalArgumentException("Payment method must not be null or empty.");
        }

        return switch (paymentMethod.toUpperCase().trim()) {
            case "CASH"   -> new CashSettlementStrategy(driverDAO);
            case "WALLET" -> new WalletSettlementStrategy(userDAO, driverDAO);
            case "CARD"   -> new CardSettlementStrategy(driverDAO);
            default -> throw new IllegalArgumentException(
                "Unsupported payment method: '" + paymentMethod + "'. " +
                "Supported methods: CASH, WALLET, CARD");
        };
    }
}
