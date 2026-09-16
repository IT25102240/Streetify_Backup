package com.streetify;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.streetify.dao.UserDAO;
import com.streetify.entity.User;
import com.streetify.entity.UserRole;

/**
 * Streetify Backend — Main Entry Point
 *
 * Sri Lankan web-based ride-hailing platform.
 * Tech Stack: Spring Boot 3.2 | MSSQL | JWT | STOMP WebSockets
 *
 * Run: mvn spring-boot:run
 * Swagger: http://localhost:8080/swagger-ui.html
 */
@SpringBootApplication
public class StreetifyApplication {

    public static void main(String[] args) {
        SpringApplication.run(StreetifyApplication.class, args);
    }

    @Bean
    CommandLineRunner initAdminAccounts(UserDAO userDAO, PasswordEncoder passwordEncoder) {
        return args -> {
            seedAdmin(userDAO, passwordEncoder, "admin@streetify.lk",   "admin123",   "System",   "Admin",   "SUPER_ADMIN",  "0000000000");
            seedAdmin(userDAO, passwordEncoder, "vidura@streetify.lk",  "vidura123",  "Vidura",   "Rammandalagedara", "SUPER_ADMIN",  "0711000001");
            seedAdmin(userDAO, passwordEncoder, "lahiru@streetify.lk",  "lahiru123",  "Lahiru",   "Nayanamina",       "USER_MGMT",    "0711000002");
            seedAdmin(userDAO, passwordEncoder, "chanuka@streetify.lk", "chanuka123", "Chanuka",  "Dharmakeerthi",    "BOOKING_MGMT", "0711000003");
            seedAdmin(userDAO, passwordEncoder, "tharindu@streetify.lk","tharindu123","Tharindu", "Senaka",           "DRIVER_MGMT",  "0711000004");
            seedAdmin(userDAO, passwordEncoder, "daham@streetify.lk",   "daham123",   "Daham",    "Edirisinghe",      "PAYMENT_MGMT", "0711000005");
            seedAdmin(userDAO, passwordEncoder, "mithun@streetify.lk",  "mithun123",  "Mithun",   "Weerasingha",      "REVIEW_MGMT",  "0711000006");
        };
    }

    private void seedAdmin(UserDAO userDAO, PasswordEncoder enc,
                           String email, String password,
                           String firstName, String lastName,
                           String adminRole, String phone) {
        if (userDAO.findByEmail(email).isEmpty()) {
            User admin = new User();
            admin.setEmail(email);
            admin.setPasswordHash(enc.encode(password));
            admin.setRole(UserRole.ADMIN);
            admin.setFirstName(firstName);
            admin.setLastName(lastName);
            admin.setPhone(phone);
            admin.setAdminRole(adminRole);
            admin.setActive(true);
            userDAO.save(admin);
            System.out.println("✅ Admin seeded: " + email + " [" + adminRole + "]");
        }
    }
}
