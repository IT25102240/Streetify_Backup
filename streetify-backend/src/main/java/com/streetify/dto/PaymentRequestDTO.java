package com.streetify.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * PaymentRequestDTO — Request body for POST /api/payments/process
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class PaymentRequestDTO {

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // CASH | CARD | WALLET

    // For CARD payments — masked card details for display only
    private String cardLastFour;
    private String cardType;     // VISA | MASTERCARD

    public PaymentRequestDTO() {}

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getCardLastFour() { return cardLastFour; }
    public void setCardLastFour(String cardLastFour) { this.cardLastFour = cardLastFour; }

    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }
}
