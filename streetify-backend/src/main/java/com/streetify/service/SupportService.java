package com.streetify.service;

import com.streetify.dao.DisputeDAO;
import com.streetify.dao.PassengerDAO;
import com.streetify.dao.TripDAO;
import com.streetify.dao.UserDAO;
import com.streetify.dto.DisputeResolveDTO;
import com.streetify.dto.DisputeSubmitDTO;
import com.streetify.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SupportService — Dispute/ticket management for passenger support.
 *
 * Handles:
 *   1. Passenger creates a dispute ticket
 *   2. STAFF investigates and resolves (approve/reject refund)
 *   3. If approved: passenger wallet credited via UserDAO
 */
@Service
@Transactional
@SuppressWarnings("null")
public class SupportService {

    private final DisputeDAO disputeDAO;
    private final PassengerDAO passengerDAO;
    private final TripDAO tripDAO;
    private final UserDAO userDAO;

    public SupportService(DisputeDAO disputeDAO,
                          PassengerDAO passengerDAO,
                          TripDAO tripDAO,
                          UserDAO userDAO) {
        this.disputeDAO = disputeDAO;
        this.passengerDAO = passengerDAO;
        this.tripDAO = tripDAO;
        this.userDAO = userDAO;
    }

    /**
     * Creates a new support dispute ticket.
     *
     * @param passengerId authenticated passenger's ID
     * @param dto         DisputeSubmitDTO
     * @return saved DisputeTicket
     */
    public DisputeTicket createDispute(Long passengerId, DisputeSubmitDTO dto) {
        Passenger passenger = passengerDAO.findById(passengerId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger not found."));

        Trip trip = null;
        if (dto.getTripId() != null) {
            trip = tripDAO.findById(dto.getTripId())
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found."));
        }

        DisputeTicket ticket = DisputeTicket.builder()
                .passenger(passenger)
                .trip(trip)
                .subject(dto.getSubject())
                .description(dto.getDescription())
                .disputeType(dto.getDisputeType())
                .requestedRefundAmount(dto.getRequestedRefundAmount())
                .status(DisputeStatus.OPEN)
                .build();

        return disputeDAO.save(ticket);
    }

    /**
     * STAFF resolves a dispute ticket.
     *
     * If approved:
     *   - Approved refund amount is credited to passenger's wallet
     *   - Status set to RESOLVED
     * If rejected:
     *   - Status set to REJECTED
     *   - No wallet change
     *
     * @param disputeId the dispute ticket ID
     * @param staffId   the authenticated staff member's ID
     * @param dto       DisputeResolveDTO { decision, resolutionNote, approvedRefundAmount }
     */
    public DisputeTicket resolveDispute(Long disputeId, Long staffId, DisputeResolveDTO dto) {
        DisputeTicket ticket = disputeDAO.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + disputeId));

        if (ticket.getStatus() == DisputeStatus.RESOLVED || ticket.getStatus() == DisputeStatus.REJECTED) {
            throw new IllegalStateException("This dispute has already been resolved.");
        }

        DisputeStatus newStatus = "RESOLVED".equalsIgnoreCase(dto.getDecision())
                ? DisputeStatus.RESOLVED
                : DisputeStatus.REJECTED;

        double approvedRefund = (dto.getApprovedRefundAmount() != null && newStatus == DisputeStatus.RESOLVED)
                ? dto.getApprovedRefundAmount()
                : 0.0;

        // Apply refund to passenger wallet if approved
        if (newStatus == DisputeStatus.RESOLVED && approvedRefund > 0) {
            userDAO.creditWallet(ticket.getPassenger().getId(), approvedRefund);
        }

        // Update dispute in DB
        disputeDAO.resolveDispute(
                disputeId,
                newStatus,
                dto.getResolutionNote(),
                approvedRefund,
                staffId,
                LocalDateTime.now()
        );

        return disputeDAO.findById(disputeId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<DisputeTicket> getAllPendingDisputes() {
        return disputeDAO.findAllPending();
    }

    @Transactional(readOnly = true)
    public List<DisputeTicket> getPassengerDisputes(Long passengerId) {
        return disputeDAO.findByPassengerIdOrderByCreatedAtDesc(passengerId);
    }
}
