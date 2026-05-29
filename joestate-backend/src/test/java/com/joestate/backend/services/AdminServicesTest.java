package com.joestate.backend.services;

import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.Report;
import com.joestate.backend.entities.User;
import com.joestate.backend.entities.VerificationRequest;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.ReportRepository;
import com.joestate.backend.repositories.UserRepository;
import com.joestate.backend.repositories.VerificationRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private VerificationRequestRepository verificationRequestRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminService adminService;

    private User adminUser;
    private User regularUser;
    private Report mockReport;
    private VerificationRequest mockVerification;
    private Property mockProperty;

    @BeforeEach
    void setUp() {
        // 1. Setup Admin
        adminUser = new User();
        adminUser.setUserId(1L);
        adminUser.setEmail("admin@joestate.com");
        adminUser.setRole(User.Role.ADMIN);

        // 2. Setup Regular User (The one being reported/verified)
        regularUser = new User();
        regularUser.setUserId(2L);
        regularUser.setEmail("user@test.com");
        regularUser.setBanStatus(User.BanStatus.NONE);
        regularUser.setVerified(false);

        // 3. Setup a Property owned by the regular user
        mockProperty = new Property();
        mockProperty.setPropertyId(10L);
        mockProperty.setOwner(regularUser);
        mockProperty.setStatus(Property.Status.ACTIVE);

        // 4. Setup a Pending Report against the user
        mockReport = new Report();
        mockReport.setReportId(100L);
        mockReport.setStatus(Report.ReportStatus.PENDING);
        mockReport.setType(Report.ReportType.USER);
        mockReport.setReportedUser(regularUser);

        // 5. Setup a Verification Request
        mockVerification = new VerificationRequest();
        mockVerification.setRequestId(200L);
        mockVerification.setStatus(VerificationRequest.RequestStatus.PENDING);
        mockVerification.setUser(regularUser);
        mockVerification.setEnterpriseName("Test Real Estate Co.");
    }

    // ==========================================
    // 1. MODERATION QUEUE TESTS (Race Conditions)
    // ==========================================

    @Test
    void claimReport_Success() {
        when(reportRepository.findById(100L)).thenReturn(Optional.of(mockReport));
        when(userRepository.findByEmail("admin@joestate.com")).thenReturn(Optional.of(adminUser));

        adminService.claimReport(100L, "admin@joestate.com");

        assertEquals(adminUser, mockReport.getAssignedAdmin(), "Admin should be assigned to the report");
        verify(reportRepository, times(1)).save(mockReport);
    }

    @Test
    void claimReport_Fails_IfAlreadyClaimedByAnotherAdmin() {
        User otherAdmin = new User();
        otherAdmin.setUserId(3L);
        otherAdmin.setEmail("otheradmin@joestate.com");
        mockReport.setAssignedAdmin(otherAdmin); // Already claimed!

        when(reportRepository.findById(100L)).thenReturn(Optional.of(mockReport));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            adminService.claimReport(100L, "admin@joestate.com");
        });

        assertEquals("Race Condition: This report was just claimed by another administrator.", exception.getMessage());
        verify(reportRepository, never()).save(any());
    }

    // ==========================================
    // 2. RESOLUTION TESTS (Bans & Cascades)
    // ==========================================

    @Test
    void resolveReport_BanUser_SuccessAndCascadesToProperties() {
        // Arrange
        mockReport.setAssignedAdmin(adminUser); // Admin has claimed it
        when(reportRepository.findById(100L)).thenReturn(Optional.of(mockReport));
        when(userRepository.findById(2L)).thenReturn(Optional.of(regularUser));
        when(userRepository.findByEmail("admin@joestate.com")).thenReturn(Optional.of(adminUser));

        List<Property> userProperties = new ArrayList<>();
        userProperties.add(mockProperty);
        when(propertyRepository.findAllByOwner_UserId(2L)).thenReturn(userProperties);

        // Act
        adminService.resolveReport(100L, "BAN_USER", "Spamming users", "admin@joestate.com");

        // Assert
        assertEquals(Report.ReportStatus.RESOLVED_BANNED, mockReport.getStatus(), "Report should be marked as resolved/banned");
        assertEquals(User.BanStatus.BANNED, regularUser.getBanStatus(), "User should be banned");
        assertEquals(Property.Status.SUSPENDED, mockProperty.getStatus(), "User's properties should be automatically suspended");

        verify(propertyRepository, times(1)).saveAll(userProperties);
        verify(reportRepository, times(2)).save(any()); // Once for audit log, once for the actual report
    }

    // ==========================================
    // 3. VERIFICATION TESTS
    // ==========================================

    @Test
    void resolveVerification_Approve_Success() {
        // Arrange
        mockVerification.setAssignedAdmin(adminUser);
        when(verificationRequestRepository.findById(200L)).thenReturn(Optional.of(mockVerification));

        // Act
        adminService.resolveVerification(200L, "APPROVE", "Documents verified.", "admin@joestate.com");

        // Assert
        assertEquals(VerificationRequest.RequestStatus.APPROVED, mockVerification.getStatus());
        assertTrue(regularUser.isVerified(), "User should have verified badge");
        assertEquals("Test Real Estate Co.", regularUser.getEnterpriseName(), "Enterprise name should be set");

        verify(userRepository, times(1)).save(regularUser);
        verify(notificationService, times(1)).createSystemAlertNotification(eq(regularUser), anyString(), isNull());
    }
}