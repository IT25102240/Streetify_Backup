package com.streetify.service.payment;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.UserDAO;

/**
 * WalletSettlementStrategy — ConcreteStrategy (GoF Strategy Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Strategy (Behavioral)
 * Member    : Daham (IT25102225) — Payment & Ledger Management
 * Role      : Concrete Strategy for WALLET payments
 * ─────────────────────────────────────────────────────────────────
 *
 * WALLET payment settlement logic:
 *   - Passenger's Streetify digital wallet is debited the full fare.
 *   - Platform retains 15% commission.
 *   - Driver's digital wallet is credited with 85% net earnings.
 *   - All transactions are digital — no physical cash changes hands.
 */
public class WalletSettlementStrategy implements PaymentSettlementStrategy {

    private final UserDAO userDAO;
    private final DriverDAO driverDAO;

    public WalletSettlementStrategy(UserDAO userDAO, DriverDAO driverDAO) {
        this.userDAO = userDAO;
        this.driverDAO = driverDAO;
    }

    /**
     * WALLET settlement:
     *   1. Debit grossAmount from passenger's wallet balance.
     *   2. Credit driverNet (85%) to driver's wallet balance.
     *   3. Platform retains the 15% commission difference.
     */
    @Override
    public void settle(Long passengerId, Long driverId,
                       double grossAmount, double commission, double driverNet) {
        // Step 1: Debit passenger's wallet
        userDAO.debitWallet(passengerId, grossAmount);

        // Step 2: Credit driver's wallet with net earnings (after commission)
        driverDAO.creditWallet(driverId, driverNet);

        System.out.println("[WalletSettlementStrategy] Passenger #" + passengerId
                + " debited LKR " + grossAmount + " | Driver #" + driverId
                + " credited LKR " + driverNet);
    }

    @Override
    public String getMethodName() {
        return "WALLET";
    }
}
