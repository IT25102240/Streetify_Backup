package com.streetify;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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
}
