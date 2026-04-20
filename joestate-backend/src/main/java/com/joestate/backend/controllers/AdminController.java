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

    // 4. Get Platform KPIs for the Dashboard
    @GetMapping("/kpis")
    public ResponseEntity<java.util.Map<String, Long>> getPlatformKPIs() {
        return ResponseEntity.ok(adminService.getPlatformKPIs());
    }

    // 5. Master Global User Search
    @GetMapping("/users/search")
    public ResponseEntity<List<com.joestate.backend.dto.UserDTO>> searchUsers(@RequestParam String term) {
        return ResponseEntity.ok(adminService.searchUsers(term));
    }

    // 6. Fetch Pending Verifications (For the blue checkmark queue)
    @GetMapping("/verifications/pending")
    public ResponseEntity<List<com.joestate.backend.dto.VerificationRequestDTO>> getPendingVerifications() {
        return ResponseEntity.ok(adminService.getPendingVerifications());
    }

    // 7. Resolve Verification Request (Action: "APPROVE" or "REJECT")
    @PutMapping("/verifications/{requestId}/resolve")
    public ResponseEntity<String> resolveVerification(
            @PathVariable Long requestId,
            @RequestParam String action) {
        adminService.resolveVerification(requestId, action);
        return ResponseEntity.ok("Verification request marked as: " + action);
    }
    // 8. Direct Ban/Unban Toggle
    @PutMapping("/users/{userId}/ban-toggle")
    public ResponseEntity<String> toggleUserBan(@PathVariable Long userId) {
        adminService.toggleUserBan(userId);
        return ResponseEntity.ok("User ban status toggled successfully.");
    }
    // 9. Fetch ALL properties for a specific user (Admin God-Mode view)
    @GetMapping("/users/{userId}/properties")
    public ResponseEntity<List<com.joestate.backend.dto.PropertyDTO>> getAdminUserProperties(@PathVariable Long userId) {
        List<com.joestate.backend.dto.PropertyDTO> props = adminService.getUserPropertiesForAdmin(userId);
        return ResponseEntity.ok(props);
    }
    // 10. Toggle to show properties
    @PutMapping("/properties/{propertyId}/suspend-toggle")
    public ResponseEntity<String> togglePropertySuspension(@PathVariable Long propertyId) {
        adminService.togglePropertySuspension(propertyId);
        return ResponseEntity.ok("Property suspension toggled.");
    }
    // 11. Fetch resolved reports
    @GetMapping("/reports/resolved")
    public ResponseEntity<List<com.joestate.backend.dto.ReportDTO>> getResolvedReports() {
        return ResponseEntity.ok(adminService.getResolvedReports());
    }
    // 12. Fetch suspended properties
    @GetMapping("/properties/suspended")
    public ResponseEntity<List<com.joestate.backend.dto.PropertyDTO>> getSuspendedProperties() {
        return ResponseEntity.ok(adminService.getSuspendedPropertiesArchive());
    }

    // 13. Fetch Live Activity Feed
    @GetMapping("/activity")
    public ResponseEntity<List<java.util.Map<String, Object>>> getRecentActivity() {
        return ResponseEntity.ok(adminService.getRecentActivity());
    }
}