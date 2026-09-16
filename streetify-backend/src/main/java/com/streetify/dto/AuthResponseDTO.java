package com.streetify.dto;

/**
 * AuthResponseDTO — Response body for POST /api/auth/login
 * Plain Java with manual Builder (no Lombok — Java 24 compatibility).
 */
public class AuthResponseDTO {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
    private Long userId;
    private String email;
    private String fullName;
    private String role;
    private String verificationStatus;
    private String vehicleInfo;
    private String message;
    private String adminRole;

    public AuthResponseDTO() {}

    public AuthResponseDTO(String accessToken, String refreshToken, long expiresIn, String tokenType,
                           Long userId, String email, String fullName, String role, String verificationStatus,
                           String vehicleInfo, String message) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.tokenType = tokenType;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.verificationStatus = verificationStatus;
        this.vehicleInfo = vehicleInfo;
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String accessToken;
        private String refreshToken;
        private long expiresIn;
        private String tokenType;
        private Long userId;
        private String email;
        private String fullName;
        private String role;
        private String verificationStatus;
        private String vehicleInfo;
        private String message;
        private String adminRole;

        public Builder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
        public Builder refreshToken(String refreshToken) { this.refreshToken = refreshToken; return this; }
        public Builder expiresIn(long expiresIn) { this.expiresIn = expiresIn; return this; }
        public Builder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder verificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; return this; }
        public Builder vehicleInfo(String vehicleInfo) { this.vehicleInfo = vehicleInfo; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder adminRole(String adminRole) { this.adminRole = adminRole; return this; }

        public AuthResponseDTO build() {
            AuthResponseDTO dto = new AuthResponseDTO(accessToken, refreshToken, expiresIn, tokenType, userId, email, fullName, role, verificationStatus, vehicleInfo, message);
            dto.adminRole = adminRole;
            return dto;
        }
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getVehicleInfo() { return vehicleInfo; }
    public void setVehicleInfo(String vehicleInfo) { this.vehicleInfo = vehicleInfo; }

    public String getAdminRole() { return adminRole; }
    public void setAdminRole(String adminRole) { this.adminRole = adminRole; }
}
