package com.joestate.backend.services;

import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.Report;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.ReportRepository;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public Report createReport(String reporterEmail, Long propertyId, Report.Reason reason, String comment) {

        if (reportRepository.existsByReporter_EmailAndProperty_PropertyIdAndReason(reporterEmail, propertyId, reason)) {
            throw new RuntimeException("You have already reported this property for this specific reason.");
        }

        // 1. Safely find the user by their JWT email
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Find the property being reported
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // 3. Create and save the report
        Report report = new Report();
        report.setReporter(reporter);
        report.setProperty(property);
        report.setReason(reason);
        report.setComment(comment);
        // Note: status defaults to PENDING automatically based on your Entity!

        return reportRepository.save(report);
    }
    // Fetch only pending reports for the Admin Dashboard
    public java.util.List<com.joestate.backend.dto.ReportDTO> getPendingReports() {
        return reportRepository.findByStatus(Report.ReportStatus.PENDING)
                .stream()
                .map(this::mapToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    // Helper method to map Entity to DTO
    private com.joestate.backend.dto.ReportDTO mapToDTO(Report r) {
        return com.joestate.backend.dto.ReportDTO.builder()
                .reportId(r.getReportId())
                .reason(r.getReason())
                .comment(r.getComment())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .reporterName(r.getReporter().getFirstName() + " " + r.getReporter().getLastName())
                .reporterEmail(r.getReporter().getEmail())
                .propertyId(r.getProperty().getPropertyId())
                .propertyTitle(r.getProperty().getTitle())
                .ownerName(r.getProperty().getOwner().getFirstName() + " " + r.getProperty().getOwner().getLastName())
                .ownerEmail(r.getProperty().getOwner().getEmail())
                .build();
    }
}