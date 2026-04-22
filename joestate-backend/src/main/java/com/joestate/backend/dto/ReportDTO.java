package com.joestate.backend.dto;

import com.joestate.backend.entities.Report.Reason;
import com.joestate.backend.entities.Report.ReportStatus;
import com.joestate.backend.entities.Report.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDTO {
    private Long reportId;
    private ReportType type;
    private Reason reason;
    private String comment;
    private ReportStatus status;
    private LocalDateTime createdAt;

    // Info about the person who reported it
    private String reporterName;
    private String reporterEmail;

    // Info about the Admin handling the case
    private Long assignedAdminId;
    private String assignedAdminName;
    private String adminNotes;

    // Optional: Info about the property being reported
    private Long propertyId;
    private String propertyTitle;
    private String ownerName;
    private String ownerEmail;

    // Optional: Info about the USER being reported
    private Long reportedUserId;
    private String reportedUserName;
}