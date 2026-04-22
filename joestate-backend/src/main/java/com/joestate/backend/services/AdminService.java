package com.joestate.backend.services;

import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.Report;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.ReportRepository;
import com.joestate.backend.repositories.VerificationRequestRepository;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final ReportRepository reportRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final NotificationService notificationService;

    // ==========================================
    // 1. DASHBOARD & TELEMETRY
    // ==========================================

    public java.util.Map<String, Long> getPlatformKPIs() {
        java.util.Map<String, Long> kpis = new java.util.HashMap<>();
        kpis.put("totalUsers", userRepository.count());
        kpis.put("bannedUsers", userRepository.countByBanStatus(User.BanStatus.BANNED));
        kpis.put("activeProperties", propertyRepository.countByStatus(Property.Status.ACTIVE));
        kpis.put("suspendedProperties", propertyRepository.countByStatus(Property.Status.SUSPENDED));
        kpis.put("pendingReports", reportRepository.countByStatus(Report.ReportStatus.PENDING));
        kpis.put("resolvedReports", reportRepository.count() - reportRepository.countByStatus(Report.ReportStatus.PENDING));
        kpis.put("pendingVerifications", verificationRequestRepository.countByStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.PENDING));
        return kpis;
    }

    public List<java.util.Map<String, Object>> getRecentActivity() {
        List<java.util.Map<String, Object>> activities = new java.util.ArrayList<>();

        for (User u : userRepository.findTop5ByOrderByCreatedAtDesc()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("type", "USER_JOINED");
            map.put("message", "User '" + u.getFirstName() + " " + u.getLastName() + "' joined the platform.");
            map.put("timestamp", u.getCreatedAt());
            activities.add(map);
        }

        for (Report r : reportRepository.findTop5ByOrderByCreatedAtDesc()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("type", "REPORT_FILED");
            String reporterName = r.getReporter().getFirstName() + " " + r.getReporter().getLastName();
            if (r.getType() == Report.ReportType.PROPERTY) {
                map.put("message", reporterName + " reported Property '" + r.getProperty().getTitle() + "' for " + r.getReason().name() + ".");
            } else {
                map.put("message", reporterName + " reported User '" + r.getReportedUser().getFirstName() + " " + r.getReportedUser().getLastName() + "' for " + r.getReason().name() + ".");
            }
            map.put("timestamp", r.getCreatedAt());
            activities.add(map);
        }

        activities.sort((a, b) -> ((java.time.LocalDateTime) b.get("timestamp")).compareTo((java.time.LocalDateTime) a.get("timestamp")));
        return activities.size() > 6 ? activities.subList(0, 6) : activities;
    }

    // ==========================================
    // 2. USER MANAGEMENT & AUDITING
    // ==========================================

    public List<com.joestate.backend.dto.UserDTO> searchUsers(String searchTerm) {
        return userRepository.searchUsersGlobally(searchTerm).stream()
                .map(user -> com.joestate.backend.dto.UserDTO.builder()
                        .userId(user.getUserId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .phoneNumber(user.getPhoneNumber())
                        .role(user.getRole().name())
                        .banStatus(user.getBanStatus().name())
                        .isVerified(user.isVerified())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    public List<com.joestate.backend.dto.ReportDTO> getUserReportHistory(Long userId) {
        return reportRepository.findByReporter_UserIdOrReportedUser_UserId(userId, userId)
                .stream().map(this::mapReportToDTO).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updateUserBanStatusWithAudit(Long userId, com.joestate.backend.entities.User.BanStatus newStatus, String notes, String adminEmail) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        User admin = userRepository.findByEmail(adminEmail).orElseThrow(() -> new RuntimeException("Admin not found"));

        user.setBanStatus(newStatus);

        if (newStatus == com.joestate.backend.entities.User.BanStatus.BANNED) {
            List<Property> userProperties = propertyRepository.findAllByOwner_UserId(userId);
            for (Property p : userProperties) p.setStatus(Property.Status.SUSPENDED);
            propertyRepository.saveAll(userProperties);
        }
        userRepository.save(user);

        Report auditLog = new Report();
        auditLog.setType(Report.ReportType.USER);
        auditLog.setReportedUser(user);
        auditLog.setReporter(admin);
        auditLog.setAssignedAdmin(admin);
        auditLog.setReason(Report.Reason.INAPPROPRIATE);
        auditLog.setComment("MANUAL SYSTEM OVERRIDE");
        auditLog.setAdminNotes(notes + " (Action: " + newStatus.name() + ")");
        auditLog.setStatus(Report.ReportStatus.RESOLVED_BANNED);

        reportRepository.save(auditLog);
    }

    // ==========================================
    // 3. PROPERTY MANAGEMENT
    // ==========================================

    public List<com.joestate.backend.dto.PropertyDTO> getUserPropertiesForAdmin(Long userId) {
        return propertyRepository.findAllByOwner_UserId(userId).stream()
                .map(p -> com.joestate.backend.dto.PropertyDTO.builder()
                        .propertyId(p.getPropertyId())
                        .title(p.getTitle())
                        .status(p.getStatus())
                        .price(p.getPrice())
                        .location(p.getLocation())
                        .datePosted(p.getDatePosted())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    public List<com.joestate.backend.dto.PropertyDTO> getSuspendedPropertiesArchive() {
        return propertyRepository.findByStatusOrderByDatePostedDesc(com.joestate.backend.entities.Property.Status.SUSPENDED).stream()
                .map(p -> com.joestate.backend.dto.PropertyDTO.builder()
                        .propertyId(p.getPropertyId())
                        .title(p.getTitle())
                        .status(p.getStatus())
                        .price(p.getPrice())
                        .location(p.getLocation())
                        .datePosted(p.getDatePosted())
                        .ownerName(p.getOwner().getFirstName() + " " + p.getOwner().getLastName())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void togglePropertySuspension(Long propertyId, String notes, String adminEmail) {
        com.joestate.backend.entities.Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        String actionTaken;

        // Toggle Status & Send Notification
        if (property.getStatus() == com.joestate.backend.entities.Property.Status.SUSPENDED) {
            property.setStatus(com.joestate.backend.entities.Property.Status.ACTIVE);
            actionTaken = "REACTIVATED";
            notificationService.createSystemAlertNotification(property.getOwner(), "Good news! Your property '" + property.getTitle() + "' has been reactivated.", property.getPropertyId());
        } else {
            property.setStatus(com.joestate.backend.entities.Property.Status.SUSPENDED);
            actionTaken = "SUSPENDED";
            notificationService.createSystemAlertNotification(property.getOwner(), "URGENT: Your property '" + property.getTitle() + "' has been suspended by the Trust & Safety team.", property.getPropertyId());
        }
        propertyRepository.save(property);

        // CREATE THE AUDIT TRAIL (Pseudo-Report)
        Report auditLog = new Report();
        auditLog.setType(Report.ReportType.PROPERTY);
        auditLog.setProperty(property);
        auditLog.setReporter(admin); // Admin is technically the reporter
        auditLog.setAssignedAdmin(admin); // Admin handled it
        auditLog.setReason(Report.Reason.INAPPROPRIATE); // Reusing enum
        auditLog.setComment("MANUAL PROPERTY OVERRIDE");
        auditLog.setAdminNotes(notes + " (Action: " + actionTaken + ")");
        auditLog.setStatus(Report.ReportStatus.RESOLVED_DISMISSED); // Saved directly to archives

        reportRepository.save(auditLog);
    }

    // ==========================================
    // 4. ZENDESK-STYLE MODERATION QUEUE
    // ==========================================

    public List<com.joestate.backend.dto.ReportDTO> getGlobalQueue() {
        return reportRepository.findByStatusAndAssignedAdminIsNull(Report.ReportStatus.PENDING)
                .stream().map(this::mapReportToDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.joestate.backend.dto.ReportDTO> getMyWorkspace(String adminEmail) {
        return reportRepository.findByStatusAndAssignedAdmin_Email(Report.ReportStatus.PENDING, adminEmail)
                .stream().map(this::mapReportToDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.joestate.backend.dto.ReportDTO> getResolvedReports() {
        return reportRepository.findAll().stream()
                .filter(r -> r.getStatus() != com.joestate.backend.entities.Report.ReportStatus.PENDING)
                .map(this::mapReportToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void claimReport(Long reportId, String adminEmail) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (report.getStatus() != Report.ReportStatus.PENDING) {
            throw new RuntimeException("This report has already been resolved.");
        }

        if (report.getAssignedAdmin() != null) {
            if (report.getAssignedAdmin().getEmail().equals(adminEmail)) return;
            throw new RuntimeException("Race Condition: This report was just claimed by another administrator.");
        }

        User admin = userRepository.findByEmail(adminEmail).orElseThrow(() -> new RuntimeException("Admin not found"));
        report.setAssignedAdmin(admin);
        reportRepository.save(report);
    }

    @Transactional
    public void resolveReport(Long reportId, String action, String notes, String adminEmail) {
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new RuntimeException("Report not found"));

        if (report.getStatus() != Report.ReportStatus.PENDING) {
            throw new RuntimeException("This report was already resolved.");
        }

        if (report.getAssignedAdmin() == null || !report.getAssignedAdmin().getEmail().equals(adminEmail)) {
            throw new RuntimeException("You must claim this report before resolving it.");
        }

        report.setAdminNotes(notes);

        User scammer;
        Property property = null;

        if (report.getType() == Report.ReportType.PROPERTY) {
            property = report.getProperty();
            scammer = property.getOwner();
        } else {
            scammer = report.getReportedUser();
        }

        switch (action.toUpperCase()) {
            case "DISMISS":
                report.setStatus(Report.ReportStatus.RESOLVED_DISMISSED);
                break;
            case "DELETE_PROPERTY":
                if (report.getType() == Report.ReportType.PROPERTY && property != null) {
                    report.setStatus(Report.ReportStatus.RESOLVED_DELETED);
                    property.setStatus(Property.Status.SUSPENDED);
                    propertyRepository.save(property);

                    notificationService.createSystemAlertNotification(
                            property.getOwner(),
                            "URGENT: Your property '" + property.getTitle() + "' has been suspended following a Trust & Safety review.",
                            property.getPropertyId()
                    );
                } else {
                    throw new RuntimeException("Cannot delete property on a User-type report.");
                }
                break;
            case "MUTE_MESSAGES":
                report.setStatus(Report.ReportStatus.RESOLVED_BANNED);
                updateUserBanStatusWithAudit(scammer.getUserId(), User.BanStatus.MUTE_MESSAGES, notes, adminEmail);
                break;
            case "MUTE_PUBLISHING":
                report.setStatus(Report.ReportStatus.RESOLVED_BANNED);
                updateUserBanStatusWithAudit(scammer.getUserId(), User.BanStatus.MUTE_PUBLISHING, notes, adminEmail);
                break;
            case "MUTE_BOTH":
                report.setStatus(Report.ReportStatus.RESOLVED_BANNED);
                updateUserBanStatusWithAudit(scammer.getUserId(), User.BanStatus.MUTE_BOTH, notes, adminEmail);
                break;
            case "BAN_USER":
                report.setStatus(Report.ReportStatus.RESOLVED_BANNED);
                updateUserBanStatusWithAudit(scammer.getUserId(), User.BanStatus.BANNED, notes, adminEmail);
                break;
            default:
                throw new RuntimeException("Invalid admin action");
        }

        reportRepository.save(report);
    }

    // ==========================================
    // 5. ENTERPRISE VERIFICATION
    // ==========================================

    public List<com.joestate.backend.dto.VerificationRequestDTO> getPendingVerifications() {
        return verificationRequestRepository.findByStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.PENDING).stream()
                .map(v -> com.joestate.backend.dto.VerificationRequestDTO.builder()
                        .requestId(v.getRequestId())
                        .userId(v.getUser().getUserId())
                        .userEmail(v.getUser().getEmail())
                        .userFullName(v.getUser().getFirstName() + " " + v.getUser().getLastName())
                        .documentUrl(v.getDocumentUrl())
                        .status(v.getStatus())
                        .submittedAt(v.getSubmittedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void resolveVerification(Long requestId, String action) {
        com.joestate.backend.entities.VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if ("APPROVE".equalsIgnoreCase(action)) {
            request.setStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.APPROVED);
            User user = request.getUser();
            user.setVerified(true);
            userRepository.save(user);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            request.setStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.REJECTED);
        } else {
            throw new RuntimeException("Invalid action. Use APPROVE or REJECT.");
        }
        verificationRequestRepository.save(request);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private com.joestate.backend.dto.ReportDTO mapReportToDTO(com.joestate.backend.entities.Report r) {
        var builder = com.joestate.backend.dto.ReportDTO.builder()
                .reportId(r.getReportId())
                .type(r.getType())
                .reason(r.getReason())
                .comment(r.getComment())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .reporterName(r.getReporter().getFirstName() + " " + r.getReporter().getLastName())
                .reporterEmail(r.getReporter().getEmail())
                .adminNotes(r.getAdminNotes())
                .assignedAdminId(r.getAssignedAdmin() != null ? r.getAssignedAdmin().getUserId() : null)
                .assignedAdminName(r.getAssignedAdmin() != null ? r.getAssignedAdmin().getFirstName() + " " + r.getAssignedAdmin().getLastName() : null);

        if (r.getType() == com.joestate.backend.entities.Report.ReportType.PROPERTY) {
            builder.propertyId(r.getProperty().getPropertyId())
                    .propertyTitle(r.getProperty().getTitle())
                    .ownerName(r.getProperty().getOwner().getFirstName() + " " + r.getProperty().getOwner().getLastName())
                    .ownerEmail(r.getProperty().getOwner().getEmail());
        } else if (r.getType() == com.joestate.backend.entities.Report.ReportType.USER) {
            builder.reportedUserId(r.getReportedUser().getUserId())
                    .reportedUserName(r.getReportedUser().getFirstName() + " " + r.getReportedUser().getLastName());
        }

        return builder.build();
    }
}