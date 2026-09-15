package com.streetify.controller;

import com.streetify.dto.PaymentReceiptDTO;
import com.streetify.dto.PaymentRequestDTO;
import com.streetify.security.JwtUtil;
import com.streetify.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * PaymentController — Payment processing REST endpoint.
 *
 * Routes:
 *   POST /api/payments/process → Process payment for a completed trip (PASSENGER)
 *
 * All bodies bound via @RequestBody + DTO. No manual JSON extraction.
 * @Transactional is on the service layer (PaymentService), not here.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUtil jwtUtil;

    public PaymentController(PaymentService paymentService, JwtUtil jwtUtil) {
        this.paymentService = paymentService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /api/payments/process
     *
     * Processes payment for a COMPLETED trip.
     * Deducts 15% commission, credits driver wallet.
     * Returns a clean receipt object.
     *
     * Frontend: Payment.tsx "Pay Now" button.
     *
     * @param dto           PaymentRequestDTO { tripId, paymentMethod }
     * @param authorization Bearer JWT token
     */
    @PostMapping("/process")
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<PaymentReceiptDTO> processPayment(
            @Valid @RequestBody PaymentRequestDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        Long passengerId = jwtUtil.extractUserId(authorization.substring(7));
        PaymentReceiptDTO receipt = paymentService.processPayment(passengerId, dto);
        return ResponseEntity.ok(receipt);
    }
}
