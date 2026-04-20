package com.joestate.backend.repositories;

import com.joestate.backend.entities.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(Report.ReportStatus status);
    // Check if this specific user already reported this property for this specific reason
    boolean existsByReporter_EmailAndProperty_PropertyIdAndReason(String email, Long propertyId, Report.Reason reason);
    // Used for the Admin Dashboard KPIs
    long countByStatus(Report.ReportStatus status);

    // Fetch newest reports for the activity feed
    List<Report> findTop5ByOrderByCreatedAtDesc();

}