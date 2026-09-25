package com.streetify.controller;

import com.streetify.dto.DisputeResolveDTO;
import com.streetify.dto.DisputeSubmitDTO;
import com.streetify.entity.DisputeTicket;
import com.streetify.security.JwtUtil;
import com.streetify.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * DisputeController — Support ticket management endpoints.
 *
 * Routes:
 *   POST /api/disputes/create            → Passenger creates a dispute
 *   PUT  /api/disputes/{id}/resolve      → STAFF/ADMIN resolves the dispute
 *   GET  /api/disputes/pending           → STAFF: list all pending tickets
 *   GET  /api/disputes/my               → Passenger: my dispute history
 */
@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final SupportService supportService;
    private final com.streetify.dao.DisputeDAO disputeDAO;
    private final JwtUtil jwtUtil;

    public DisputeController(SupportService supportService, com.streetify.dao.DisputeDAO disputeDAO, JwtUtil jwtUtil) {
        this.supportService = supportService;
        this.disputeDAO = disputeDAO;
        this.jwtUtil = jwtUtil;
    }

    /**
     * GET /api/disputes
     * Customer Support Officer portal: list all dispute tickets.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllDisputes() {
        List<DisputeTicket> tickets = disputeDAO.findAll();
        List<java.util.Map<String, Object>> result = tickets.stream().map(d -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", d.getId());
            map.put("ticketRef", "TKT-" + String.format("%05d", d.getId()));
            map.put("passengerName", d.getPassenger() != null ? d.getPassenger().getFullName() : "Anonymous");
            map.put("driverName", (d.getTrip() != null && d.getTrip().getDriver() != null) ? d.getTrip().getDriver().getFullName() : "Unassigned");
            map.put("tripId", d.getTrip() != null ? d.getTrip().getId() : null);
            map.put("subject", d.getSubject());
            map.put("description", d.getDescription());
            map.put("disputeType", d.getDisputeType());
            map.put("status", d.getStatus().name());
            map.put("resolution", d.getResolutionNote() != null ? d.getResolutionNote() : "");
            map.put("createdAt", d.getCreatedAt() != null ? d.getCreatedAt().toString() : "");
            map.put("updatedAt", d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : "");
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/disputes/stats
     * Live metrics for Customer Support Officer dashboard.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getDisputeStats() {
        long open = disputeDAO.countByStatus(com.streetify.entity.DisputeStatus.OPEN);
        long inReview = disputeDAO.countByStatus(com.streetify.entity.DisputeStatus.UNDER_REVIEW);
        long resolved = disputeDAO.countByStatus(com.streetify.entity.DisputeStatus.RESOLVED);
        return ResponseEntity.ok(java.util.Map.of(
            "open", open,
            "inReview", inReview,
            "resolved", resolved,
            "avgResponseHours", 18
        ));
    }

    /**
     * PATCH /api/disputes/{id}/status
     * Customer Support Officer moves dispute to IN_REVIEW or CLOSED.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body
    ) {
        DisputeTicket ticket = disputeDAO.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispute ticket not found: " + id));
        String statusStr = body.get("status");
        if (statusStr != null) {
            ticket.setStatus(com.streetify.entity.DisputeStatus.valueOf(statusStr));
            disputeDAO.save(ticket);
        }
        return ResponseEntity.ok(java.util.Map.of("status", "ok", "ticketStatus", ticket.getStatus().name()));
    }

    /**
     * POST /api/disputes/create
     * Frontend: Review.tsx dispute form or dedicated disputes screen.
     */
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<DisputeTicket> createDispute(
            @Valid @RequestBody DisputeSubmitDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        Long passengerId = jwtUtil.extractUserId(authorization.substring(7));
        DisputeTicket ticket = supportService.createDispute(passengerId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    /**
     * PUT or PATCH /api/disputes/{id}/resolve
     * STAFF/ADMIN reviews and resolves a ticket.
     * If refund approved → passenger wallet credited in MSSQL.
     */
    @RequestMapping(value = "/{id}/resolve", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> resolveDispute(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader("Authorization") String authorization
    ) {
        Long staffId = jwtUtil.extractUserId(authorization.substring(7));
        String resolution = (String) body.getOrDefault("resolution", body.get("resolutionNote"));
        String decision = (String) body.getOrDefault("status", body.get("decision"));
        Double refundAmount = body.containsKey("approvedRefundAmount") ? ((Number) body.get("approvedRefundAmount")).doubleValue() : null;

        DisputeResolveDTO dto = new DisputeResolveDTO();
        dto.setDecision(decision != null ? decision : "RESOLVED");
        dto.setResolutionNote(resolution != null ? resolution : "Resolved by Support Officer.");
        dto.setApprovedRefundAmount(refundAmount);

        DisputeTicket resolved = supportService.resolveDispute(id, staffId, dto);
        return ResponseEntity.ok(java.util.Map.of(
            "status", "ok",
            "ticketRef", "TKT-" + String.format("%05d", resolved.getId()),
            "ticketStatus", resolved.getStatus().name(),
            "resolution", resolved.getResolutionNote() != null ? resolved.getResolutionNote() : ""
        ));
    }

    /**
     * GET /api/disputes/pending
     * STAFF view of all open dispute tickets.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<List<DisputeTicket>> getPendingDisputes() {
        return ResponseEntity.ok(supportService.getAllPendingDisputes());
    }

    /**
     * GET /api/disputes/my
     * Passenger's own dispute history.
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<List<DisputeTicket>> getMyDisputes(
            @RequestHeader("Authorization") String authorization
    ) {
        Long passengerId = jwtUtil.extractUserId(authorization.substring(7));
        return ResponseEntity.ok(supportService.getPassengerDisputes(passengerId));
    }
}
