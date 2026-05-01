package com.joestate.backend.services;

import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.dto.PaymentRequest;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional // 1. CLASS-LEVEL: All methods are transactional by default (Safe for Writes)
public class UserService {

    private final UserRepository userRepository;

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

        // We don't need to explicitly call repository.save(user) here!
        // Because of @Transactional, Spring detects the changes to the 'user' entity
        // and automatically pushes them to the database when the method finishes.
        return mapToDTO(user);
    }

    public void upgradeToPremium(String email, PaymentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String cleanCard = request.getCardNumber().replaceAll("\\s+", "");

        // Universal Testing Card
        if ("4242424242424242".equals(cleanCard)) {
            user.setPremium(true); // Hibernate will auto-save this because of @Transactional
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
            // 1. Write to the File System FIRST
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, file.getBytes());

            // 2. Update the Database SECOND
            user.setProfilePictureUrl(newFileName);

            // If anything fails after this point, Spring will roll back the database automatically.
            return newFileName;

        } catch (Exception e) {
            // 3. THE SAFETY NET: If writing to the DB fails, we must manually delete the orphaned file!
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ioException) {
                System.err.println("CRITICAL: Failed to delete orphaned file: " + filePath);
            }
            // Re-throw to trigger the Database Rollback
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
        }
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
                .isPremium(user.isPremium()) // NEW: Included for Phase 1!
                .createdAt(user.getCreatedAt())
                .build();
    }
}