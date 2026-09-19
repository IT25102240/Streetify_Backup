package com.streetify.service;

import com.streetify.dao.DriverDAO;
import com.streetify.dao.DriverDocumentDAO;
import com.streetify.entity.DocumentStatus;
import com.streetify.entity.Driver;
import com.streetify.entity.DriverDocument;
import com.streetify.entity.DriverVerificationStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * DriverVerificationService — Handles driver document upload and review workflow.
 *
 * Responsibilities:
 *   1. Save uploaded document files to local disk
 *   2. Create DriverDocument records in DB
 *   3. Allow STAFF to approve/reject individual documents
 *   4. Auto-promote driver to APPROVED when all 3 documents are verified
 *
 * Supported document types: license | reg | insurance
 * Supported file types: PDF, JPEG, PNG (max 10 MB — enforced in application.properties)
 */
@Service
@Transactional
@SuppressWarnings("null")
public class DriverVerificationService {

    private final DriverDAO driverDAO;
    private final DriverDocumentDAO documentDAO;

    @Value("${streetify.upload.directory}")
    private String uploadDirectory;

    private static final List<String> VALID_DOC_TYPES = Arrays.asList("license", "reg", "insurance");
    private static final List<String> ALLOWED_CONTENT_TYPES =
            Arrays.asList("application/pdf", "image/jpeg", "image/png");

    public DriverVerificationService(DriverDAO driverDAO, DriverDocumentDAO documentDAO) {
        this.driverDAO = driverDAO;
        this.documentDAO = documentDAO;
    }

    // ─── Document Upload ──────────────────────────────────────────────────────

    /**
     * Saves an uploaded document file for a driver.
     *
     * Steps:
     *   1. Validate docType and file content type
     *   2. Create driver-specific upload directory
     *   3. Save file to disk
     *   4. Create/update DriverDocument record in DB
     *   5. Check if all 3 docs uploaded → update driver status
     *
     * @param driverId  the driver's ID (from JWT)
     * @param docType   "license" | "reg" | "insurance"
     * @param file      the uploaded MultipartFile
     * @return the saved DriverDocument entity
     */
    public DriverDocument uploadDocument(Long driverId, String docType, MultipartFile file) throws IOException {
        // Validate doc type
        if (!VALID_DOC_TYPES.contains(docType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid document type: " + docType +
                    ". Must be one of: " + VALID_DOC_TYPES);
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Only PDF, JPEG, and PNG are accepted.");
        }

        // Validate file size (additional check beyond Spring limit)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10 MB limit.");
        }

        // Load driver
        Driver driver = driverDAO.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverId));

        // Create driver-specific directory: ./uploads/documents/driver-42/
        Path driverDir = Paths.get(uploadDirectory, "driver-" + driverId);
        Files.createDirectories(driverDir);

        // Generate unique filename: license_20260915_123456789.pdf
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = docType.toLowerCase() + "_" + timestamp + extension;
        Path filePath = driverDir.resolve(filename);

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Save or update DriverDocument record
        DriverDocument document = documentDAO
                .findByDriverIdAndDocType(driverId, docType.toLowerCase())
                .orElse(new DriverDocument());

        document.setDriver(driver);
        document.setDocType(docType.toLowerCase());
        document.setOriginalFilename(file.getOriginalFilename());
        document.setFilePath(filePath.toString());
        document.setFileSizeBytes(file.getSize());
        document.setContentType(contentType);
        document.setStatus(DocumentStatus.PENDING);

        DriverDocument saved = documentDAO.save(document);

        return saved;
    }

    // ─── Document Review (STAFF) ──────────────────────────────────────────────

    /**
     * STAFF approves or rejects a specific document.
     *
     * If all 3 documents are now APPROVED → auto-promote driver to APPROVED status.
     *
     * @param docId       the DriverDocument ID
     * @param approved    true = APPROVED, false = REJECTED
     * @param reviewNote  reviewer's note (required for rejection)
     */
    public void reviewDocument(Long docId, boolean approved, String reviewNote) {
        DriverDocument document = documentDAO.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + docId));

        DocumentStatus newStatus = approved ? DocumentStatus.APPROVED : DocumentStatus.REJECTED;

        documentDAO.updateDocumentStatus(docId, newStatus, reviewNote, LocalDateTime.now());

        // Check if all 3 documents are now approved
        Long driverId = document.getDriver().getId();
        long approvedCount = documentDAO.countApprovedDocumentsByDriverId(driverId);

        if (approvedCount >= 3) {
            // Auto-promote driver to APPROVED
            driverDAO.updateVerificationStatus(driverId, DriverVerificationStatus.APPROVED);
            // Also activate the account so they can log in
            driverDAO.findById(driverId).ifPresent(driver -> {
                driver.setActive(true);
                driverDAO.save(driver);
            });
        } else if (!approved) {
            // Mark driver as REJECTED if a doc is rejected
            driverDAO.updateVerificationStatus(driverId, DriverVerificationStatus.REJECTED);
        }
    }

    /**
     * Returns all documents with PENDING status (admin verification queue).
     * Admin Console: GET /api/admin/verifications
     */
    @Transactional(readOnly = true)
    public List<DriverDocument> getAllPendingDocuments() {
        return documentDAO.findByStatus(DocumentStatus.PENDING);
    }

    /**
     * Returns the verification status for a driver's documents.
     *
     * @param driverId the driver's ID
     * @return list of all uploaded documents with their status
     */
    @Transactional(readOnly = true)
    public List<DriverDocument> getDriverDocuments(Long driverId) {
        return documentDAO.findByDriverId(driverId);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".bin";
        return filename.substring(filename.lastIndexOf("."));
    }
}
