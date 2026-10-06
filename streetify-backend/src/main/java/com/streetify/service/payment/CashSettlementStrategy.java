package com.streetify.service.payment;

import com.streetify.dao.DriverDAO;

/**
 * CashSettlementStrategy — ConcreteStrategy (GoF Strategy Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 * Pattern   : Strategy (Behavioral)
 * Member    : Daham (IT25102225) — Payment & Ledger Management
 * Role      : Concrete Strategy for CASH payments
 * ─────────────────────────────────────────────────────────────────
 *
 * CASH payment settlement logic:
 *   - The driver physically collected 100% of the fare from the passenger.
 *   - The driver already holds the gross amount in physical cash.
 *   - The driver does NOT receive a digital wallet credit.
 *   - Instead, the driver OWES 15% platform commission to Streetify.
 *   - This debt is recorded via driverDAO.addCommissionDebt().
 *
 * Lecture Reference (Lecture A, Slide 18):
 *   "Concrete Strategies are the real classes that implement the
 *    Strategy interface. Each one provides a different version of
 *    the algorithm."
 */
public class CashSettlementStrategy implements PaymentSettlementStrategy {

    private final DriverDAO driverDAO;

    public CashSettlementStrategy(DriverDAO driverDAO) {
        this.driverDAO = driverDAO;
    }

    /**
     * CASH settlement:
     *   Driver physically holds the passenger's cash (100% = grossAmount).
     *   Platform records a commission debt (15%) against the driver's account.
     *   No wallet transactions occur — it's an IOU.
     */
    @Override
    public void settle(Long passengerId, Long driverId,
                       double grossAmount, double commission, double driverNet) {
        // Driver physically collected grossAmount from passenger.
        // Record that driver owes 15% platform commission to Streetify:
        driverDAO.addCommissionDebt(driverId, commission);

        System.out.println("[CashSettlementStrategy] Driver #" + driverId
                + " owes LKR " + commission + " commission to platform.");
    }

    @Override
    public String getMethodName() {
        return "CASH";
    }
}
