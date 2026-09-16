package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Review — post-trip passenger rating.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_reviews_trip", columnList = "trip_id"),
        @Index(name = "idx_reviews_driver", columnList = "driver_id")
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Review() {}

    public static ReviewBuilder builder() { return new ReviewBuilder(); }

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Trip getTrip() { return trip; }
    public Passenger getPassenger() { return passenger; }
    public Driver getDriver() { return driver; }
    public Integer getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setRating(Integer rating) { this.rating = rating; }
    public void setComment(String comment) { this.comment = comment; }

    // ── Manual Builder ────────────────────────────────────────────────────────
    public static class ReviewBuilder {
        private final Review r = new Review();
        public ReviewBuilder trip(Trip t) { r.trip = t; return this; }
        public ReviewBuilder passenger(Passenger p) { r.passenger = p; return this; }
        public ReviewBuilder driver(Driver d) { r.driver = d; return this; }
        public ReviewBuilder rating(Integer rat) { r.rating = rat; return this; }
        public ReviewBuilder comment(String c) { r.comment = c; return this; }
        public Review build() { return r; }
    }
}
