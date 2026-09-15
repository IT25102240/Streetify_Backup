package com.streetify.dto;

import jakarta.validation.constraints.*;

/**
 * DriverRegistrationDTO — Driver onboarding data.
 * Plain Java (no Lombok — Java 24 compatibility).
 */
public class DriverRegistrationDTO {

    @NotBlank(message = "First name is required") @Size(max = 100)
    private String firstName;
    @NotBlank(message = "Last name is required") @Size(max = 100)
    private String lastName;
    @NotBlank(message = "Email is required") @Email
    private String email;
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{9,15}$")
    private String phone;
    @NotBlank(message = "NIC number is required") @Size(min = 9, max = 20)
    private String nic;
    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;
    @NotBlank(message = "Number plate is required") @Size(max = 20)
    private String numberPlate;
    @NotNull(message = "Year of manufacture is required") @Min(1990) @Max(2030)
    private Integer yearOfManufacture;
    private String make;
    private String model;
    private String color;
    @NotBlank(message = "Password is required") @Size(min = 8)
    private String password;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getNumberPlate() { return numberPlate; }
    public void setNumberPlate(String numberPlate) { this.numberPlate = numberPlate; }
    public Integer getYearOfManufacture() { return yearOfManufacture; }
    public void setYearOfManufacture(Integer yearOfManufacture) { this.yearOfManufacture = yearOfManufacture; }
    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
