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

    // 1. Create Property Report
    public Report createPropertyReport(String reporterEmail, Long propertyId, Report.Reason reason, String comment) {
        java.time.LocalDateTime thirtyMinsAgo = java.time.LocalDateTime.now().minusMinutes(30);

        if (reportRepository.existsByReporter_EmailAndProperty_PropertyIdAndReasonAndCreatedAtAfter(reporterEmail, propertyId, reason, thirtyMinsAgo)) {
            throw new RuntimeException("You already reported this property recently. Please wait 30 minutes before submitting another report for this reason.");
        }
        User reporter = userRepository.findByEmail(reporterEmail).orElseThrow();
        Property property = propertyRepository.findById(propertyId).orElseThrow();

        Report report = new Report();
        report.setType(Report.ReportType.PROPERTY);
        report.setReporter(reporter);
        report.setProperty(property);
        report.setReason(reason);
        report.setComment(comment);
        return reportRepository.save(report);
    }

    // 2. Create User Report
    public Report createUserReport(String reporterEmail, Long reportedUserId, Report.Reason reason, String comment) {
        java.time.LocalDateTime thirtyMinsAgo = java.time.LocalDateTime.now().minusMinutes(30);

        if (reportRepository.existsByReporter_EmailAndReportedUser_UserIdAndReasonAndCreatedAtAfter(reporterEmail, reportedUserId, reason, thirtyMinsAgo)) {
            throw new RuntimeException("You already reported this user recently. Please wait 30 minutes before submitting another report for this reason.");
        }
        User reporter = userRepository.findByEmail(reporterEmail).orElseThrow();
        User reportedUser = userRepository.findById(reportedUserId)
                .orElseThrow(() -> new RuntimeException("Reported user not found"));

        if (reporter.getUserId().equals(reportedUserId)) {
            throw new RuntimeException("You cannot report yourself.");
        }

        Report report = new Report();
        report.setType(Report.ReportType.USER);
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReason(reason);
        report.setComment(comment);
        return reportRepository.save(report);
    }

    public java.util.List<com.joestate.backend.dto.ReportDTO> getPendingReports() {
        return reportRepository.findByStatus(Report.ReportStatus.PENDING)
                .stream().map(this::mapToDTO).collect(java.util.stream.Collectors.toList());
    }

    // Smart DTO Mapper
    private com.joestate.backend.dto.ReportDTO mapToDTO(Report r) {
        var builder = com.joestate.backend.dto.ReportDTO.builder()
                .reportId(r.getReportId())
                .type(r.getType())
                .reason(r.getReason())
                .comment(r.getComment())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .reporterName(r.getReporter().getFirstName() + " " + r.getReporter().getLastName())
                .reporterEmail(r.getReporter().getEmail());

        if (r.getType() == Report.ReportType.PROPERTY) {
            builder.propertyId(r.getProperty().getPropertyId())
                    .propertyTitle(r.getProperty().getTitle())
                    .ownerName(r.getProperty().getOwner().getFirstName() + " " + r.getProperty().getOwner().getLastName())
                    .ownerEmail(r.getProperty().getOwner().getEmail());
        } else if (r.getType() == Report.ReportType.USER) {
            builder.reportedUserId(r.getReportedUser().getUserId())
                    .reportedUserName(r.getReportedUser().getFirstName() + " " + r.getReportedUser().getLastName());
        }

        return builder.build();
    }
}