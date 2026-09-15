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
    private final JwtUtil jwtUtil;

    public DisputeController(SupportService supportService, JwtUtil jwtUtil) {
        this.supportService = supportService;
        this.jwtUtil = jwtUtil;
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
     * PUT /api/disputes/{id}/resolve
     * STAFF/ADMIN reviews and resolves a ticket.
     * If refund approved → passenger wallet credited.
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<DisputeTicket> resolveDispute(
            @PathVariable Long id,
            @Valid @RequestBody DisputeResolveDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        Long staffId = jwtUtil.extractUserId(authorization.substring(7));
        DisputeTicket resolved = supportService.resolveDispute(id, staffId, dto);
        return ResponseEntity.ok(resolved);
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
