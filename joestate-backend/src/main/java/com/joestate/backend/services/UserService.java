package com.joestate.backend.services;

import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.dto.PaymentRequest;
import com.joestate.backend.dto.VerificationRequestDTO;
import com.joestate.backend.entities.User;
import com.joestate.backend.entities.Subscription;
import com.joestate.backend.entities.VerificationRequest;
import com.joestate.backend.repositories.UserRepository;
import com.joestate.backend.repositories.SubscriptionRepository;
import com.joestate.backend.repositories.VerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional // 1. CLASS-LEVEL: All methods are transactional by default (Safe for Writes)
public class UserService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final PasswordEncoder passwordEncoder;

    // Directory where uploads are stored
    private final String UPLOAD_DIR = "uploads/";

    // ==========================================
    // READ OPERATIONS (Optimized for Speed)
    // ==========================================

    @Transactional(readOnly = true) // 2. OVERRIDE: Tells Hibernate not to track changes, boosting performance
    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getPublicUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    // ==========================================
    // WRITE OPERATIONS (Protected by Transactions)
    // ==========================================

    public UserDTO updateProfile(String email, UserDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setBio(dto.getBio());

        // 2. PASSWORD UPDATE LOGIC
        // Only trigger this if the user actually typed a new password in the frontend
        if (dto.getNewPassword() != null && !dto.getNewPassword().trim().isEmpty()) {

            // Safety Check 1: Did they provide their current password?
            if (dto.getOldPassword() == null || dto.getOldPassword().trim().isEmpty()) {
                throw new RuntimeException("You must enter your current password to change it.");
            }

            // Safety Check 2: Does the old password match what's in the database?
            if (!passwordEncoder.matches(dto.getOldPassword(), user.getPasswordHash())) {
                throw new RuntimeException("Your current password is incorrect.");
            }

            // If it matches, hash the new password and save it!
            user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        }

        return mapToDTO(user);
    }

    public void upgradeToPremium(String email, PaymentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Check if they are ALREADY Premium
        if (user.isPremium()) {
            throw new RuntimeException("You already have an active Premium subscription.");
        }

        // 2. Validate Expiry Date Format (MM/YY)
        if (request.getExpiryDate() == null || !request.getExpiryDate().matches("^(0[1-9]|1[0-2])/\\d{2}$")) {
            throw new RuntimeException("Invalid expiry date. Must be in MM/YY format.");
        }

        // 3. Validate CVC (Exactly 3 digits)
        if (request.getCvc() == null || !request.getCvc().matches("^\\d{3}$")) {
            throw new RuntimeException("Invalid CVC. Must be exactly 3 digits.");
        }

        // 4. Validate Card Number
        String cleanCard = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s+", "") : "";

        if ("4242424242424242".equals(cleanCard)) {

            // --- THE NEW ENTERPRISE LOGIC ---
            Subscription subscription = new Subscription();
            subscription.setUser(user);
            subscription.setType(Subscription.SubscriptionType.PREMIUM);
            subscription.setStartDate(LocalDateTime.now());
            subscription.setEndDate(LocalDateTime.now().plusMonths(1)); // Expires in 1 month
            subscription.setActive(true);

            // Generate a fake bank receipt ID for our records
            subscription.setPaymentReference("MOCK_TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

            subscriptionRepository.save(subscription);

            // B. Update the fast-access boolean flag on the User
            user.setPremium(true);

        } else {
            throw new RuntimeException("Card Declined. Insufficient funds or invalid card number.");
        }
    }

    // ==========================================
    // COMPLEX OPERATION: DB + FILE SYSTEM
    // ==========================================

    public String uploadProfilePicture(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFileName = UUID.randomUUID().toString() + extension;
        Path filePath = Paths.get(UPLOAD_DIR + newFileName);

        try {
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, file.getBytes());

            user.setProfilePictureUrl(newFileName);

            return newFileName;

        } catch (Exception e) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ioException) {
                System.err.println("CRITICAL: Failed to delete orphaned file: " + filePath);
            }
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
        }
    }

    @Transactional
    public void submitVerificationTicket(String email, MultipartFile file, String userMessage, String enterpriseName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isPremium()) {
            throw new RuntimeException("Only Premium members can request Enterprise Verification.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        String newFileName = "VERIFY_" + UUID.randomUUID().toString() + extension;
        Path filePath = Paths.get(UPLOAD_DIR + newFileName);

        try {
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, file.getBytes());

            VerificationRequest ticket = new VerificationRequest();
            ticket.setUser(user);
            ticket.setDocumentUrl(newFileName);
            ticket.setUserMessage(userMessage);
            ticket.setEnterpriseName(enterpriseName);
            ticket.setStatus(VerificationRequest.RequestStatus.PENDING);

            verificationRequestRepository.save(ticket);

        } catch (Exception e) {
            throw new RuntimeException("Failed to upload verification document: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public VerificationRequestDTO getMyVerificationTicket(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return verificationRequestRepository.findTopByUserOrderBySubmittedAtDesc(user)
                .map(v -> VerificationRequestDTO.builder()
                        .requestId(v.getRequestId())
                        .documentUrl(v.getDocumentUrl())
                        .userMessage(v.getUserMessage())
                        .adminReply(v.getAdminReply())
                        .status(v.getStatus())
                        .submittedAt(v.getSubmittedAt())
                        .enterpriseName(v.getEnterpriseName())
                        .build())
                .orElse(null);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .profilePictureUrl(user.getProfilePictureUrl())
                .bio(user.getBio())
                .role(user.getRole().name())
                .isVerified(user.isVerified())
                .isPremium(user.isPremium())
                .enterpriseName(user.getEnterpriseName())
                .banStatus(user.getBanStatus() != null ? user.getBanStatus().name() : "NONE")
                .createdAt(user.getCreatedAt())
                .build();
    }
}