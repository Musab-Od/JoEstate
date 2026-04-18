package com.joestate.backend.controllers;

import com.joestate.backend.dto.ReportDTO;
import com.joestate.backend.services.AdminService;
import com.joestate.backend.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService; // Inject ReportService to fetch the queue

    // 1. Manually Ban a User
    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<String> banUser(@PathVariable Long userId) {
        adminService.banUserAndSuspendProperties(userId);
        return ResponseEntity.ok("User has been banned and their listings suspended.");
    }

    // 2. Fetch the Pending Reports Queue
    @GetMapping("/reports/pending")
    public ResponseEntity<List<ReportDTO>> getPendingReports() {
        return ResponseEntity.ok(reportService.getPendingReports());
    }

    // 3. Resolve a Report (Action can be: "DISMISS", "DELETE_PROPERTY", or "BAN_USER")
    @PutMapping("/reports/{reportId}/resolve")
    public ResponseEntity<String> resolveReport(
            @PathVariable Long reportId,
            @RequestParam String action) {

        adminService.resolveReport(reportId, action);
        return ResponseEntity.ok("Report resolved successfully with action: " + action);
    }
}