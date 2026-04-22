package com.joestate.backend.repositories;

import com.joestate.backend.entities.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(Report.ReportStatus status);

    // Anti-spam: Check if a report was made AFTER a specific time (30-minute cooldown)
    boolean existsByReporter_EmailAndProperty_PropertyIdAndReasonAndCreatedAtAfter(
            String email, Long propertyId, Report.Reason reason, java.time.LocalDateTime cutoffTime);

    boolean existsByReporter_EmailAndReportedUser_UserIdAndReasonAndCreatedAtAfter(
            String email, Long reportedUserId, Report.Reason reason, java.time.LocalDateTime cutoffTime);

    long countByStatus(Report.ReportStatus status);
    List<Report> findTop5ByOrderByCreatedAtDesc();

    // 1. The Global Queue: Pending and NOT claimed yet
    List<Report> findByStatusAndAssignedAdminIsNull(Report.ReportStatus status);

    // 2. My Workspace: Pending and claimed by specific admin email
    List<Report> findByStatusAndAssignedAdmin_Email(Report.ReportStatus status, String email);

    List<Report> findByReporter_UserIdOrReportedUser_UserId(Long reporterId, Long reportedId);
}