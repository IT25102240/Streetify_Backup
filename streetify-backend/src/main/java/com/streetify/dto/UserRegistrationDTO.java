package com.streetify.dto;

import jakarta.validation.constraints.*;

/**
 * UserRegistrationDTO — Captures passenger self-registration form data.
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class UserRegistrationDTO {

    @NotBlank(message = "First name is required") @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required") @Size(max = 100)
    private String lastName;

    @NotBlank(message = "Email is required") @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required") @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{9,15}$", message = "Enter a valid phone number")
    private String phone;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
