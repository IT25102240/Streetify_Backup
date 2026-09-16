package com.streetify.controller;

import com.streetify.dto.ReviewResponseDTO;
import com.streetify.dto.ReviewSubmitDTO;
import com.streetify.entity.Review;
import com.streetify.security.JwtUtil;
import com.streetify.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ReviewController — Post-trip review submission endpoints.
 *
 * Routes:
 *   POST /api/reviews          → Submit a review (PASSENGER)
 *   GET  /api/reviews/driver/{driverId} → Get driver's reviews (public)
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtUtil jwtUtil;

    public ReviewController(ReviewService reviewService, JwtUtil jwtUtil) {
        this.reviewService = reviewService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /api/reviews
     *
     * Passenger submits a 1–5 star review for a completed trip.
     * Updates driver's average rating.
     * Frontend: Review.tsx "Submit Review" button.
     *
     * @param dto           ReviewSubmitDTO { tripId, rating, comment }
     * @param authorization Bearer JWT
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PASSENGER','ADMIN')")
    public ResponseEntity<ReviewResponseDTO> submitReview(
            @Valid @RequestBody ReviewSubmitDTO dto,
            @RequestHeader("Authorization") String authorization
    ) {
        Long passengerId = jwtUtil.extractUserId(authorization.substring(7));
        Review review = reviewService.submitReview(passengerId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ReviewResponseDTO(review));
    }

    /**
     * GET /api/reviews/driver/{driverId}
     *
     * Returns all reviews for a specific driver.
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<ReviewResponseDTO>> getDriverReviews(@PathVariable Long driverId) {
        List<ReviewResponseDTO> reviews = reviewService.getDriverReviews(driverId).stream()
                .map(ReviewResponseDTO::new)
                .toList();
        return ResponseEntity.ok(reviews);
    }
}
