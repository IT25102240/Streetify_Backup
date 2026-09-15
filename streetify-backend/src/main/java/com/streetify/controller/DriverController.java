package com.streetify.controller;

import com.streetify.entity.DriverDocument;
import com.streetify.security.JwtUtil;
import com.streetify.service.DriverVerificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * DriverController — Driver dashboard and document management endpoints.
 *
 * Routes:
 *   POST /api/driver/upload-documents   → Multipart document upload (DRIVER)
 *   GET  /api/driver/{id}/status        → Driver verification status (PUBLIC)
 *   GET  /api/driver/{id}/documents     → List driver's documents (DRIVER/STAFF/ADMIN)
 *   POST /api/driver/documents/{id}/review → Review a document (STAFF/ADMIN)
 *   PATCH /api/driver/{id}/status       → Toggle online/offline (DRIVER)
 *
 * Documents: multipart/form-data — NO manual JSON extraction.
 */
@RestController
@RequestMapping("/api/driver")
public class DriverController {

    private final DriverVerificationService verificationService;
    private final JwtUtil jwtUtil;

    public DriverController(DriverVerificationService verificationService, JwtUtil jwtUtil) {
        this.verificationService = verificationService;
        this.jwtUtil = jwtUtil;
    }

    // ─── Document Upload ──────────────────────────────────────────────────────

    /**
     * POST /api/driver/upload-documents
     * Content-Type: multipart/form-data
     *
     * Uploads a single verification document for the authenticated driver.
     * Must be called 3 times (once per doc type: license, reg, insurance).
     *
     * Frontend: Login.tsx Step 3 document upload dropzone.
     *
     * @param docType  @RequestParam "license" | "reg" | "insurance"
     * @param file     @RequestParam the uploaded file
     * @param authorization Bearer token from Authorization header
     */
    @PostMapping(value = "/upload-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("docType") String docType,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("Authorization") String authorization
    ) throws IOException {
        // Extract driver ID from JWT
        String token = authorization.substring(7);
        Long driverId = jwtUtil.extractUserId(token);

        DriverDocument saved = verificationService.uploadDocument(driverId, docType, file);

        return ResponseEntity.ok(Map.of(
                "docId",    saved.getId(),
                "docType",  saved.getDocType(),
                "filename", saved.getOriginalFilename(),
                "status",   saved.getStatus().name(),
                "message",  "Document uploaded successfully. Pending review."
        ));
    }

    // ─── Driver Status ────────────────────────────────────────────────────────

    /**
     * GET /api/driver/{id}/status
     *
     * Returns the driver's verification status.
     * Frontend: Login.tsx polls this after registration to show "pending/approved".
     *
     * @param id driver's database ID
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> getDriverStatus(@PathVariable Long id) {
        List<DriverDocument> docs = verificationService.getDriverDocuments(id);
        long approvedCount = docs.stream()
                .filter(d -> d.getStatus().name().equals("APPROVED"))
                .count();
        long pendingCount = docs.stream()
                .filter(d -> d.getStatus().name().equals("PENDING"))
                .count();

        return ResponseEntity.ok(Map.of(
                "driverId",      id,
                "totalDocuments", docs.size(),
                "approvedDocs",  approvedCount,
                "pendingDocs",   pendingCount,
                "allVerified",   approvedCount >= 3
        ));
    }

    // ─── List Driver Documents ───────────────────────────────────────────────

    /**
     * GET /api/driver/{id}/documents
     * Admin/Staff: view documents submitted by a specific driver.
     */
    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('DRIVER','STAFF','ADMIN')")
    public ResponseEntity<List<DriverDocument>> getDriverDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(verificationService.getDriverDocuments(id));
    }

    // ─── Document Review (STAFF/ADMIN) ───────────────────────────────────────

    /**
     * POST /api/driver/documents/{docId}/review
     *
     * STAFF reviews a submitted document (approve or reject).
     * Auto-promotes driver to APPROVED if all 3 docs cleared.
     *
     * @param docId    the document's ID
     * @param approved @RequestParam true=APPROVED, false=REJECTED
     * @param note     @RequestParam review note (required for rejection)
     */
    @PostMapping("/documents/{docId}/review")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<Map<String, String>> reviewDocument(
            @PathVariable Long docId,
            @RequestParam boolean approved,
            @RequestParam(required = false, defaultValue = "") String note
    ) {
        verificationService.reviewDocument(docId, approved, note);
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "message", "Document " + (approved ? "APPROVED" : "REJECTED") + " successfully."
        ));
    }
}
