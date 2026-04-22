package com.joestate.backend.controllers;

import com.joestate.backend.dto.ReportDTO;
import com.joestate.backend.services.AdminService;
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

    // ==========================================
    // 1. DASHBOARD & TELEMETRY
    // ==========================================

    @GetMapping("/kpis")
    public ResponseEntity<java.util.Map<String, Long>> getPlatformKPIs() {
        return ResponseEntity.ok(adminService.getPlatformKPIs());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<java.util.Map<String, Object>>> getRecentActivity() {
        return ResponseEntity.ok(adminService.getRecentActivity());
    }

    // ==========================================
    // 2. USER MANAGEMENT & AUDITING
    // ==========================================

    @GetMapping("/users/search")
    public ResponseEntity<List<com.joestate.backend.dto.UserDTO>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(adminService.searchUsers(query));
    }

    @GetMapping("/users/{userId}/reports")
    public ResponseEntity<List<ReportDTO>> getUserReportHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserReportHistory(userId));
    }

    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<String> updateUserBanStatus(
            @PathVariable Long userId,
            @RequestParam com.joestate.backend.entities.User.BanStatus status,
            @RequestParam(required = false, defaultValue = "Manual Admin Override") String notes) {

        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.updateUserBanStatusWithAudit(userId, status, notes, adminEmail);
        return ResponseEntity.ok("User restriction updated to: " + status);
    }

    // ==========================================
    // 3. PROPERTY MANAGEMENT
    // ==========================================

    @GetMapping("/users/{userId}/properties")
    public ResponseEntity<List<com.joestate.backend.dto.PropertyDTO>> getAdminUserProperties(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserPropertiesForAdmin(userId));
    }

    @GetMapping("/properties/suspended")
    public ResponseEntity<List<com.joestate.backend.dto.PropertyDTO>> getSuspendedProperties() {
        return ResponseEntity.ok(adminService.getSuspendedPropertiesArchive());
    }

    @PutMapping("/properties/{propertyId}/suspend-toggle")
    public ResponseEntity<String> togglePropertySuspension(
            @PathVariable Long propertyId,
            @RequestParam(required = false, defaultValue = "Manual Admin Override") String notes) {

        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.togglePropertySuspension(propertyId, notes, adminEmail);

        return ResponseEntity.ok("Property suspension toggled and audited.");
    }

    // ==========================================
    // 4. MODERATION QUEUE
    // ==========================================

    @GetMapping("/reports/queue")
    public ResponseEntity<List<ReportDTO>> getGlobalQueue() {
        return ResponseEntity.ok(adminService.getGlobalQueue());
    }

    @GetMapping("/reports/workspace")
    public ResponseEntity<List<ReportDTO>> getMyWorkspace() {
        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminService.getMyWorkspace(adminEmail));
    }

    @GetMapping("/reports/resolved")
    public ResponseEntity<List<ReportDTO>> getResolvedReports() {
        return ResponseEntity.ok(adminService.getResolvedReports());
    }

    @PutMapping("/reports/{reportId}/claim")
    public ResponseEntity<String> claimReport(@PathVariable Long reportId) {
        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.claimReport(reportId, adminEmail);
        return ResponseEntity.ok("Report claimed successfully.");
    }

    public static class ResolveRequest {
        public String action;
        public String notes;
    }

    @PutMapping("/reports/{reportId}/resolve")
    public ResponseEntity<String> resolveReport(
            @PathVariable Long reportId,
            @RequestBody ResolveRequest request) {
        String adminEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.resolveReport(reportId, request.action, request.notes, adminEmail);
        return ResponseEntity.ok("Report resolved successfully.");
    }

    // ==========================================
    // 5. ENTERPRISE VERIFICATION
    // ==========================================

    @GetMapping("/verifications/pending")
    public ResponseEntity<List<com.joestate.backend.dto.VerificationRequestDTO>> getPendingVerifications() {
        return ResponseEntity.ok(adminService.getPendingVerifications());
    }

    @PutMapping("/verifications/{requestId}/resolve")
    public ResponseEntity<String> resolveVerification(
            @PathVariable Long requestId,
            @RequestParam String action) {
        adminService.resolveVerification(requestId, action);
        return ResponseEntity.ok("Verification request marked as: " + action);
    }
}