package com.joestate.backend.controllers;

import com.joestate.backend.entities.Report;
import com.joestate.backend.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    private final ReportService reportService;

    // A clean static class to map the incoming JSON (No reporterId needed!)
    public static class ReportRequest {
        public Report.Reason reason;
        public String comment;
    }

    @PostMapping("/property/{propertyId}")
    public ResponseEntity<?> submitReport(
            @PathVariable Long propertyId,
            @RequestBody ReportRequest request) {

        try {
            // 1. Safely extract the logged-in user's email from the Security Context (JWT)
            String reporterEmail = SecurityContextHolder.getContext().getAuthentication().getName();

            // 2. Pass it to the service
            Report newReport = reportService.createReport(
                    reporterEmail,
                    propertyId,
                    request.reason,
                    request.comment
            );

            return ResponseEntity.ok("Report submitted successfully! Report ID: " + newReport.getReportId());

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error occurred: " + e.getMessage());
        }
    }
}