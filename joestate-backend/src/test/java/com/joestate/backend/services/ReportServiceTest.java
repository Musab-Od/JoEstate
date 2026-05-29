package com.joestate.backend.services;

import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.Report;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.ReportRepository;
import com.joestate.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @InjectMocks
    private ReportService reportService;

    private User reporter;
    private User scammer;
    private Property mockProperty;

    @BeforeEach
    void setUp() {
        // 1. Setup Reporter
        reporter = new User();
        reporter.setUserId(1L);
        reporter.setEmail("reporter@joestate.com");
        reporter.setFirstName("Good");
        reporter.setLastName("Citizen");

        // 2. Setup Reported User (Scammer)
        scammer = new User();
        scammer.setUserId(2L);
        scammer.setEmail("scammer@test.com");
        scammer.setFirstName("Bad");
        scammer.setLastName("Guy");

        // 3. Setup Property
        mockProperty = new Property();
        mockProperty.setPropertyId(10L);
        mockProperty.setOwner(scammer);
        mockProperty.setTitle("Fake Villa");
    }

    // ==========================================
    // 1. PROPERTY REPORT TESTS
    // ==========================================

    @Test
    void createPropertyReport_Success() {
        // Arrange: No recent reports exist
        when(reportRepository.existsByReporter_EmailAndProperty_PropertyIdAndReasonAndCreatedAtAfter(
                eq("reporter@joestate.com"), eq(10L), eq(Report.Reason.FRAUD), any(LocalDateTime.class)))
                .thenReturn(false);

        when(userRepository.findByEmail("reporter@joestate.com")).thenReturn(Optional.of(reporter));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(mockProperty));

        Report savedReport = new Report();
        savedReport.setReportId(100L);
        when(reportRepository.save(any(Report.class))).thenReturn(savedReport);

        // Act
        Report result = reportService.createPropertyReport("reporter@joestate.com", 10L, Report.Reason.FRAUD, "This is a fake listing.");

        // Assert
        assertNotNull(result);
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    void createPropertyReport_Fails_WhenSpammingReports() {
        // Arrange: Simulate that the user ALREADY reported this recently (returns true)
        when(reportRepository.existsByReporter_EmailAndProperty_PropertyIdAndReasonAndCreatedAtAfter(
                eq("reporter@joestate.com"), eq(10L), eq(Report.Reason.FRAUD), any(LocalDateTime.class)))
                .thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            reportService.createPropertyReport("reporter@joestate.com", 10L, Report.Reason.FRAUD, "Spamming the report button!");
        });

        assertTrue(exception.getMessage().contains("Please wait 30 minutes"));
        verify(reportRepository, never()).save(any()); // Ensures no duplicate report was saved
    }

    // ==========================================
    // 2. USER REPORT TESTS
    // ==========================================

    @Test
    void createUserReport_Success() {
        // Arrange
        when(reportRepository.existsByReporter_EmailAndReportedUser_UserIdAndReasonAndCreatedAtAfter(
                eq("reporter@joestate.com"), eq(2L), eq(Report.Reason.INAPPROPRIATE), any(LocalDateTime.class)))
                .thenReturn(false);

        when(userRepository.findByEmail("reporter@joestate.com")).thenReturn(Optional.of(reporter));
        when(userRepository.findById(2L)).thenReturn(Optional.of(scammer));

        Report savedReport = new Report();
        when(reportRepository.save(any(Report.class))).thenReturn(savedReport);

        // Act
        Report result = reportService.createUserReport("reporter@joestate.com", 2L, Report.Reason.INAPPROPRIATE, "Rude in chat.");

        // Assert
        assertNotNull(result);
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    void createUserReport_Fails_WhenReportingSelf() {
        // Arrange: No spam detected
        when(reportRepository.existsByReporter_EmailAndReportedUser_UserIdAndReasonAndCreatedAtAfter(
                eq("reporter@joestate.com"), eq(1L), eq(Report.Reason.FRAUD), any(LocalDateTime.class)))
                .thenReturn(false);

        // The "reporter" and the "reported user" are the exact same person
        when(userRepository.findByEmail("reporter@joestate.com")).thenReturn(Optional.of(reporter));
        when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            // Reporter (ID 1) tries to report User ID 1
            reportService.createUserReport("reporter@joestate.com", 1L, Report.Reason.FRAUD, "I am a scammer.");
        });

        assertEquals("You cannot report yourself.", exception.getMessage());
        verify(reportRepository, never()).save(any());
    }
}