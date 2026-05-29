package com.joestate.backend.services;

import com.joestate.backend.dto.PaymentRequest;
import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.SubscriptionRepository;
import com.joestate.backend.repositories.UserRepository;
import com.joestate.backend.repositories.VerificationRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private VerificationRequestRepository verificationRequestRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        // Set up a clean fake user before every single test
        mockUser = new User();
        mockUser.setUserId(1L);
        mockUser.setEmail("musab@joestate.com");
        mockUser.setFirstName("Musab");
        mockUser.setLastName("Test");
        mockUser.setPremium(false);
        mockUser.setPasswordHash("hashed_old_password");
        mockUser.setRole(User.Role.USER);
        mockUser.setBanStatus(User.BanStatus.NONE);
        mockUser.setCreatedAt(LocalDateTime.now());
    }

    // ==========================================
    // 1. PREMIUM UPGRADE TESTS
    // ==========================================

    @Test
    void upgradeToPremium_Success_WithValidCard() {
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));

        PaymentRequest validRequest = new PaymentRequest();
        validRequest.setCardNumber("4242 4242 4242 4242");
        validRequest.setExpiryDate("12/26");
        validRequest.setCvc("123");

        userService.upgradeToPremium("musab@joestate.com", validRequest);

        assertTrue(mockUser.isPremium(), "User should be upgraded to premium");
        verify(subscriptionRepository, times(1)).save(any());
    }

    @Test
    void upgradeToPremium_Fails_WhenCardIsDeclined() {
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));

        PaymentRequest invalidRequest = new PaymentRequest();
        invalidRequest.setCardNumber("1111 2222 3333 4444"); // Wrong card
        invalidRequest.setExpiryDate("12/26");
        invalidRequest.setCvc("123");

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.upgradeToPremium("musab@joestate.com", invalidRequest);
        });

        assertEquals("Card Declined. Insufficient funds or invalid card number.", exception.getMessage());
        assertFalse(mockUser.isPremium(), "User should NOT be premium");
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void upgradeToPremium_Fails_WhenAlreadyPremium() {
        mockUser.setPremium(true); // Already premium
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));

        PaymentRequest request = new PaymentRequest();

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.upgradeToPremium("musab@joestate.com", request);
        });

        assertEquals("You already have an active Premium subscription.", exception.getMessage());
    }

    // ==========================================
    // 2. UPDATE PROFILE & PASSWORD TESTS
    // ==========================================

    @Test
    void updateProfile_Success_StandardInfoOnly() {
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));

        UserDTO updateDto = new UserDTO();
        updateDto.setFirstName("UpdatedName");
        updateDto.setLastName("UpdatedLast");
        updateDto.setPhoneNumber("0791234567");
        updateDto.setBio("New Bio");
        // Notice: Password fields are left null

        UserDTO result = userService.updateProfile("musab@joestate.com", updateDto);

        assertEquals("UpdatedName", result.getFirstName());
        assertEquals("New Bio", result.getBio());
        verify(passwordEncoder, never()).matches(anyString(), anyString()); // Password logic skipped
    }

    @Test
    void updateProfile_Success_WithPasswordChange() {
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("old_password_123", "hashed_old_password")).thenReturn(true);
        when(passwordEncoder.encode("new_password_456")).thenReturn("new_hashed_password");

        UserDTO updateDto = new UserDTO();
        updateDto.setFirstName("Musab");
        updateDto.setOldPassword("old_password_123");
        updateDto.setNewPassword("new_password_456");

        userService.updateProfile("musab@joestate.com", updateDto);

        assertEquals("new_hashed_password", mockUser.getPasswordHash(), "Password hash should be updated");
    }

    @Test
    void updateProfile_Fails_WithIncorrectOldPassword() {
        when(userRepository.findByEmail("musab@joestate.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrong_old_password", "hashed_old_password")).thenReturn(false);

        UserDTO updateDto = new UserDTO();
        updateDto.setFirstName("Musab");
        updateDto.setOldPassword("wrong_old_password");
        updateDto.setNewPassword("new_password_456");

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.updateProfile("musab@joestate.com", updateDto);
        });

        assertEquals("Your current password is incorrect.", exception.getMessage());
        assertEquals("hashed_old_password", mockUser.getPasswordHash(), "Password should remain unchanged");
    }
}