package com.streetify.service.payment;

/**
 * PaymentSettlementStrategy — Strategy Interface (GoF Strategy Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Strategy (Behavioral)
 * Member    : Daham (IT25102225) — Payment & Ledger Management
 * Role      : Strategy Interface — the common contract
 * ─────────────────────────────────────────────────────────────────
 *
 * Defines the family of interchangeable payment settlement algorithms.
 * Each concrete strategy handles the financial settlement for a
 * specific payment method (CASH, WALLET, CARD) differently.
 *
 * BEFORE (problem — long if-else in PaymentService.processPayment()):
 *   if ("CASH".equals(method)) {
 *       driverDAO.addCommissionDebt(driverId, commission);
 *   } else if ("WALLET".equals(method)) {
 *       userDAO.debitWallet(passengerId, grossAmount);
 *       driverDAO.creditWallet(driverId, driverNet);
 *   } else if ("CARD".equals(method)) {
 *       driverDAO.creditWallet(driverId, driverNet);
 *   }
 *   // Problem: adding PayHere/crypto requires editing PaymentService
 *
 * AFTER (Strategy Pattern):
 *   PaymentSettlementStrategy strategy =
 *       PaymentStrategyFactory.resolve(method, userDAO, driverDAO);
 *   strategy.settle(passengerId, driverId, grossAmount, commission, driverNet);
 *   // Adding new payment method = new class only, no PaymentService edits
 *
 * Lecture Reference (Lecture A, Slide 17):
 *   "The common interface that all strategies must follow. It defines
 *    a method but doesn't provide implementation."
 *
 * Concrete implementations (Daham creates):
 *   → CashSettlementStrategy    — driver holds cash, owes 15% commission
 *   → WalletSettlementStrategy  — debit passenger wallet, credit driver wallet
 *   → CardSettlementStrategy    — platform collected via card, credit driver net
 */
public interface PaymentSettlementStrategy {

    /**
     * Executes the financial settlement for a completed trip payment.
     *
     * Each concrete strategy implements this differently based on
     * how money flows for that payment method.
     *
     * @param passengerId  the passenger who paid
     * @param driverId     the driver who earned
     * @param grossAmount  total fare amount in LKR
     * @param commission   platform's 15% commission cut in LKR
     * @param driverNet    driver's 85% net earnings in LKR
     */
    void settle(Long passengerId,
                Long driverId,
                double grossAmount,
                double commission,
                double driverNet);

    /**
     * @return the payment method name this strategy handles
     *         (e.g. "CASH", "WALLET", "CARD")
     */
    String getMethodName();
}
