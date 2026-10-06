package com.streetify.service.payment;

import com.streetify.dao.DriverDAO;

/**
 * CardSettlementStrategy — ConcreteStrategy (GoF Strategy Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Strategy (Behavioral)
 * Member    : Daham (IT25102225) — Payment & Ledger Management
 * Role      : Concrete Strategy for CARD payments
 * ─────────────────────────────────────────────────────────────────
 *
 * CARD payment settlement logic:
 *   - Passenger pays via 3DS credit/debit card through payment gateway.
 *   - Platform collects the full grossAmount from the card gateway.
 *   - Platform retains 15% commission.
 *   - Driver's digital wallet is credited with 85% net earnings.
 *   - Similar to WALLET but passenger doesn't use a Streetify wallet balance.
 */
public class CardSettlementStrategy implements PaymentSettlementStrategy {

    private final DriverDAO driverDAO;

    public CardSettlementStrategy(DriverDAO driverDAO) {
        this.driverDAO = driverDAO;
    }

    /**
     * CARD settlement:
     *   Platform collected the full fare via the card payment gateway.
     *   Credit driver's digital wallet with net earnings (85%).
     *   Platform keeps the 15% commission.
     *   (No passenger wallet debit — payment was via external card gateway.)
     */
    @Override
    public void settle(Long passengerId, Long driverId,
                       double grossAmount, double commission, double driverNet) {
        // Platform collected grossAmount via card gateway (external).
        // Transfer 85% net earnings to driver's Streetify wallet:
        driverDAO.creditWallet(driverId, driverNet);

        System.out.println("[CardSettlementStrategy] Driver #" + driverId
                + " credited LKR " + driverNet + " (platform commission: LKR " + commission + ")");
    }

    @Override
    public String getMethodName() {
        return "CARD";
    }
}
