package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // --- NEW: Identify what is being reported ---
    public enum ReportType { PROPERTY, USER }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type;

    // Optional: Only used if reporting a property
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = true)
    private Property property;

    // Optional: Only used if reporting a user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = true)
    private User reportedUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Reason reason;

    @Column(length = 1000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id", nullable = true)
    private User assignedAdmin;

    @Column(length = 2000)
    private String adminNotes;

    public enum Reason {
        // Property Reasons
        FRAUD, INACCURATE, INAPPROPRIATE, SOLD_UNAVAILABLE,
        // User Reasons
        SCAMMER, HARASSMENT, FAKE_PROFILE
    }

    public enum ReportStatus {
        PENDING,
        RESOLVED_DISMISSED,
        RESOLVED_DELETED,
        RESOLVED_BANNED
    }
}