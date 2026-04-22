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

    public static class ReportRequest {
        public Report.Reason reason;
        public String comment;
    }

    @PostMapping("/property/{propertyId}")
    public ResponseEntity<?> submitPropertyReport(@PathVariable Long propertyId, @RequestBody ReportRequest request) {
        try {
            String reporterEmail = SecurityContextHolder.getContext().getAuthentication().getName();

            // We call the service to execute the logic, but we don't need to store the result
            reportService.createPropertyReport(reporterEmail, propertyId, request.reason, request.comment);

            return ResponseEntity.ok("Property report submitted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/user/{reportedUserId}")
    public ResponseEntity<?> submitUserReport(@PathVariable Long reportedUserId, @RequestBody ReportRequest request) {
        try {
            String reporterEmail = SecurityContextHolder.getContext().getAuthentication().getName();

            // Execute logic without storing the unused 'newReport' object
            reportService.createUserReport(reporterEmail, reportedUserId, request.reason, request.comment);

            return ResponseEntity.ok("User report submitted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}