package com.joestate.backend.services;

import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.Report; // NEW IMPORT
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.ReportRepository; // NEW IMPORT
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
                propertyRepository.delete(property); // Permanently delete the scam listing
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
}