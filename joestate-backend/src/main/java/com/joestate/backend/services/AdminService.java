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

    @Transactional
    public void banUserAndSuspendProperties(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(true);
        userRepository.save(user);

        List<Property> userProperties = propertyRepository.findAllByOwner_UserId(userId);
        for (Property property : userProperties) {
            property.setStatus(Property.Status.SUSPENDED);
        }
        propertyRepository.saveAll(userProperties);
    }

    @Transactional
    public void resolveReport(Long reportId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        Property property = report.getProperty();
        User scammer = property.getOwner();

        switch (action.toUpperCase()) {
            case "DISMISS":
                report.setStatus(Report.ReportStatus.RESOLVED_DISMISSED);
                break;

            case "DELETE_PROPERTY":
                report.setStatus(Report.ReportStatus.RESOLVED_DELETED);
                property.setStatus(Property.Status.SUSPENDED);
                propertyRepository.save(property);
                break;

            case "BAN_USER":
                report.setStatus(Report.ReportStatus.RESOLVED_BANNED);
                banUserAndSuspendProperties(scammer.getUserId()); // Drop the ban hammer!
                break;

            default:
                throw new RuntimeException("Invalid admin action");
        }

        reportRepository.save(report);
    }
    // 1. Fetch Platform Analytics (KPIs)
    public java.util.Map<String, Long> getPlatformKPIs() {
        java.util.Map<String, Long> kpis = new java.util.HashMap<>();
        kpis.put("totalUsers", userRepository.count());
        kpis.put("bannedUsers", userRepository.countByIsBannedTrue());
        kpis.put("activeProperties", propertyRepository.countByStatus(Property.Status.ACTIVE));
        kpis.put("suspendedProperties", propertyRepository.countByStatus(Property.Status.SUSPENDED));
        kpis.put("pendingReports", reportRepository.countByStatus(Report.ReportStatus.PENDING));
        kpis.put("resolvedReports", reportRepository.count() - reportRepository.countByStatus(Report.ReportStatus.PENDING));

        // ADD THIS ONE LINE:
        kpis.put("pendingVerifications", verificationRequestRepository.countByStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.PENDING));
        return kpis;
    }

    // 2. The Master Global User Search
    public List<com.joestate.backend.dto.UserDTO> searchUsers(String searchTerm) {
        return userRepository.searchUsersGlobally(searchTerm)
                .stream()
                .map(user -> com.joestate.backend.dto.UserDTO.builder()
                        .userId(user.getUserId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .phoneNumber(user.getPhoneNumber())
                        .role(user.getRole().name())
                        .isBanned(user.isBanned())
                        .isVerified(user.isVerified())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    // 3. Fetch Pending Verification Requests
    public List<com.joestate.backend.dto.VerificationRequestDTO> getPendingVerifications() {
        return verificationRequestRepository.findByStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.PENDING)
                .stream()
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

    // 4. Resolve Verification Request (Approve or Reject)
    @Transactional
    public void resolveVerification(Long requestId, String action) {
        com.joestate.backend.entities.VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if ("APPROVE".equalsIgnoreCase(action)) {
            request.setStatus(com.joestate.backend.entities.VerificationRequest.RequestStatus.APPROVED);
            // Give the user the blue checkmark!
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
    @Transactional
    public void toggleUserBan(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Flip the ban status
        user.setBanned(!user.isBanned());

        // If we just banned them, suspend all their properties instantly
        if (user.isBanned()) {
            List<Property> userProperties = propertyRepository.findAllByOwner_UserId(userId);
            for (Property property : userProperties) {
                property.setStatus(Property.Status.SUSPENDED);
            }
            propertyRepository.saveAll(userProperties);
        }

        userRepository.save(user);
    }
    // Fetch all properties for admin accordion
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

    // Individual Property Suspend Toggle
    @Transactional
    public void togglePropertySuspension(Long propertyId) {
        com.joestate.backend.entities.Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() == com.joestate.backend.entities.Property.Status.SUSPENDED) {
            property.setStatus(com.joestate.backend.entities.Property.Status.ACTIVE);
        } else {
            property.setStatus(com.joestate.backend.entities.Property.Status.SUSPENDED);
        }
        propertyRepository.save(property);
    }

    // Fetch Resolved Reports
    public List<com.joestate.backend.dto.ReportDTO> getResolvedReports() {
        // Assuming your enum has RESOLVED statuses. Adjust if your naming is slightly different!
        return reportRepository.findAll().stream()
                .filter(r -> r.getStatus() != com.joestate.backend.entities.Report.ReportStatus.PENDING)
                .map(this::mapReportToDTO) // using the mapper you already have
                .collect(java.util.stream.Collectors.toList());
    }

    // Fetch the Suspended Archive
    public List<com.joestate.backend.dto.PropertyDTO> getSuspendedPropertiesArchive() {
        return propertyRepository.findByStatusOrderByDatePostedDesc(com.joestate.backend.entities.Property.Status.SUSPENDED)
                .stream()
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
    // Helper: Map Report Entity to DTO for the Moderation Queue
    private com.joestate.backend.dto.ReportDTO mapReportToDTO(com.joestate.backend.entities.Report report) {
        return com.joestate.backend.dto.ReportDTO.builder()
                .reportId(report.getReportId())
                .propertyId(report.getProperty().getPropertyId())
                .propertyTitle(report.getProperty().getTitle())
                .reporterName(report.getReporter().getFirstName() + " " + report.getReporter().getLastName())
                .reporterEmail(report.getReporter().getEmail())
                .reason(report.getReason()) // <--- Fixed: Removed .name()
                .comment(report.getComment())
                .status(report.getStatus()) // <--- Fixed: Removed .name()
                .createdAt(report.getCreatedAt())
                .build();
    }
    public List<java.util.Map<String, Object>> getRecentActivity() {
        List<java.util.Map<String, Object>> activities = new java.util.ArrayList<>();

        // 1. Get recent users
        for (User u : userRepository.findTop5ByOrderByCreatedAtDesc()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("type", "USER_JOINED");
            map.put("message", "User '" + u.getFirstName() + " " + u.getLastName() + "' joined the platform.");
            map.put("timestamp", u.getCreatedAt());
            activities.add(map);
        }

        // 2. Get recent reports
        for (Report r : reportRepository.findTop5ByOrderByCreatedAtDesc()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("type", "REPORT_FILED");
            map.put("message", "Property '" + r.getProperty().getTitle() + "' flagged for " + r.getReason() + ".");
            map.put("timestamp", r.getCreatedAt());
            activities.add(map);
        }

        // 3. Sort them together by time (Newest first)
        activities.sort((a, b) -> ((java.time.LocalDateTime) b.get("timestamp")).compareTo((java.time.LocalDateTime) a.get("timestamp")));

        // 4. Return only the top 6 events
        return activities.size() > 6 ? activities.subList(0, 6) : activities;
    }
}