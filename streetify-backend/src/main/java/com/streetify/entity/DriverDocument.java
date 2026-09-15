package com.streetify.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * DriverDocument — Stores uploaded verification documents.
 * Manual getters/setters (no Lombok — Java 24 compatibility).
 */
@Entity
@Table(name = "driver_documents", indexes = {
        @Index(name = "idx_doc_driver_id", columnList = "driver_id")
})
public class DriverDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "doc_type", nullable = false, length = 30)
    private String docType;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(name = "reviewer_note", length = 500)
    private String reviewerNote;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public DriverDocument() {}

    // ── Getters ──────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public Driver getDriver() { return driver; }
    public String getDocType() { return docType; }
    public String getOriginalFilename() { return originalFilename; }
    public String getFilePath() { return filePath; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public String getContentType() { return contentType; }
    public DocumentStatus getStatus() { return status; }
    public String getReviewerNote() { return reviewerNote; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setDriver(Driver driver) { this.driver = driver; }
    public void setDocType(String docType) { this.docType = docType; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public void setStatus(DocumentStatus status) { this.status = status; }
    public void setReviewerNote(String reviewerNote) { this.reviewerNote = reviewerNote; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
