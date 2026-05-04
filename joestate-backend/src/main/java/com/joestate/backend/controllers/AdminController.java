package com.joestate.backend.controllers;

import com.joestate.backend.dto.ReportDTO;
import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.dto.VerificationRequestDTO;
import com.joestate.backend.dto.ReportResolutionRequest;
import com.joestate.backend.dto.VerificationResolutionRequest;
import com.joestate.backend.entities.User.BanStatus;
import com.joestate.backend.services.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<Map<String, Long>> getPlatformKPIs() {
        return ResponseEntity.ok(adminService.getPlatformKPIs());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity() {
        return ResponseEntity.ok(adminService.getRecentActivity());
    }

    // ==========================================
    // 2. USER MANAGEMENT & AUDITING
    // ==========================================

    @GetMapping("/users/search")
    public ResponseEntity<List<UserDTO>> searchUsers(
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
            @RequestParam BanStatus status,
            @RequestParam(required = false, defaultValue = "Manual Admin Override") String notes) {

        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.updateUserBanStatusWithAudit(userId, status, notes, adminEmail);
        return ResponseEntity.ok("User restriction updated to: " + status);
    }

    // ==========================================
    // 3. PROPERTY MANAGEMENT
    // ==========================================

    @GetMapping("/users/{userId}/properties")
    public ResponseEntity<List<PropertyDTO>> getAdminUserProperties(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserPropertiesForAdmin(userId));
    }

    @GetMapping("/properties/suspended")
    public ResponseEntity<List<PropertyDTO>> getSuspendedProperties() {
        return ResponseEntity.ok(adminService.getSuspendedPropertiesArchive());
    }

    @PutMapping("/properties/{propertyId}/suspend-toggle")
    public ResponseEntity<String> togglePropertySuspension(
            @PathVariable Long propertyId,
            @RequestParam(required = false, defaultValue = "Manual Admin Override") String notes) {

        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
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
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminService.getMyWorkspace(adminEmail));
    }

    @GetMapping("/reports/resolved")
    public ResponseEntity<List<ReportDTO>> getResolvedReports() {
        return ResponseEntity.ok(adminService.getResolvedReports());
    }

    @PutMapping("/reports/{reportId}/claim")
    public ResponseEntity<String> claimReport(@PathVariable Long reportId) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.claimReport(reportId, adminEmail);
        return ResponseEntity.ok("Report claimed successfully.");
    }

    @PutMapping("/reports/{reportId}/resolve")
    public ResponseEntity<String> resolveReport(
            @PathVariable Long reportId,
            @RequestBody ReportResolutionRequest request) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.resolveReport(reportId, request.getAction(), request.getNotes(), adminEmail);
        return ResponseEntity.ok("Report resolved successfully.");
    }

    // ==========================================
    // 5. ENTERPRISE VERIFICATION
    // ==========================================

    @GetMapping("/verifications/queue")
    public ResponseEntity<List<VerificationRequestDTO>> getGlobalVerificationQueue() {
        return ResponseEntity.ok(adminService.getGlobalVerificationQueue());
    }

    @GetMapping("/verifications/workspace")
    public ResponseEntity<List<VerificationRequestDTO>> getMyVerificationWorkspace() {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminService.getMyVerificationWorkspace(adminEmail));
    }

    @GetMapping("/verifications/resolved")
    public ResponseEntity<List<VerificationRequestDTO>> getResolvedVerifications() {
        return ResponseEntity.ok(adminService.getResolvedVerifications());
    }

    @GetMapping("/verifications/roster")
    public ResponseEntity<List<UserDTO>> getVerifiedAgencies() {
        return ResponseEntity.ok(adminService.getVerifiedAgencies());
    }

    @PutMapping("/verifications/{requestId}/claim")
    public ResponseEntity<String> claimVerification(@PathVariable Long requestId) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.claimVerification(requestId, adminEmail);
        return ResponseEntity.ok("Ticket claimed successfully.");
    }

    @PutMapping("/verifications/{requestId}/resolve")
    public ResponseEntity<String> resolveVerification(
            @PathVariable Long requestId,
            @RequestBody VerificationResolutionRequest requestBody) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.resolveVerification(requestId, requestBody.getAction(), requestBody.getAdminReply(), adminEmail);
        return ResponseEntity.ok("Verification request marked as: " + requestBody.getAction());
    }

    @PutMapping("/verifications/users/{userId}/revoke")
    public ResponseEntity<String> revokeVerification(@PathVariable Long userId) {
        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        adminService.revokeVerification(userId, adminEmail);
        return ResponseEntity.ok("Verification revoked successfully.");
    }
}