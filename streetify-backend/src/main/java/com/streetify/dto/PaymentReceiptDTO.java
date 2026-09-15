package com.streetify.dto;

import java.time.LocalDateTime;

/**
 * PaymentReceiptDTO — Response for POST /api/payments/process
 * Plain Java with manual Builder (no Lombok — Java 24 compatibility).
 */
public class PaymentReceiptDTO {

    private Long paymentId;
    private Long tripId;
    private String status;          // SUCCESS | FAILED

    // Amounts (LKR)
    private Double grossAmount;
    private Double platformCommission;
    private Double driverNet;

    private String paymentMethod;
    private LocalDateTime processedAt;
    private String message;

    public PaymentReceiptDTO() {}

    public PaymentReceiptDTO(Long paymentId, Long tripId, String status, Double grossAmount,
                             Double platformCommission, Double driverNet, String paymentMethod,
                             LocalDateTime processedAt, String message) {
        this.paymentId = paymentId;
        this.tripId = tripId;
        this.status = status;
        this.grossAmount = grossAmount;
        this.platformCommission = platformCommission;
        this.driverNet = driverNet;
        this.paymentMethod = paymentMethod;
        this.processedAt = processedAt;
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long paymentId;
        private Long tripId;
        private String status;
        private Double grossAmount;
        private Double platformCommission;
        private Double driverNet;
        private String paymentMethod;
        private LocalDateTime processedAt;
        private String message;

        public Builder paymentId(Long paymentId) { this.paymentId = paymentId; return this; }
        public Builder tripId(Long tripId) { this.tripId = tripId; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder grossAmount(Double grossAmount) { this.grossAmount = grossAmount; return this; }
        public Builder platformCommission(Double platformCommission) { this.platformCommission = platformCommission; return this; }
        public Builder driverNet(Double driverNet) { this.driverNet = driverNet; return this; }
        public Builder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public Builder processedAt(LocalDateTime processedAt) { this.processedAt = processedAt; return this; }
        public Builder message(String message) { this.message = message; return this; }

        public PaymentReceiptDTO build() {
            return new PaymentReceiptDTO(paymentId, tripId, status, grossAmount, platformCommission, driverNet, paymentMethod, processedAt, message);
        }
    }

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getGrossAmount() { return grossAmount; }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }

    public Double getPlatformCommission() { return platformCommission; }
    public void setPlatformCommission(Double platformCommission) { this.platformCommission = platformCommission; }

    public Double getDriverNet() { return driverNet; }
    public void setDriverNet(Double driverNet) { this.driverNet = driverNet; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
