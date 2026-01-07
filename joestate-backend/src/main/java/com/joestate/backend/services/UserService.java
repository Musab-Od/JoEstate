package com.joestate.backend.services;

import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final String UPLOAD_DIR = "uploads/";
    private final PasswordEncoder passwordEncoder;

    // 1. Get Current User Profile
    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    // 2. Update Text Information
    public UserDTO updateProfile(String currentEmail, UserDTO dto) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Handle Basic Info
        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getBio() != null) user.setBio(dto.getBio());

        // 2. Handle EMAIL Change (Crucial Check!)
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            // Check if the NEW email is already taken by someone else
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("This email is already in use by another account.");
            }
            user.setEmail(dto.getEmail());
        }

        // 3. Handle PASSWORD Change (Hash it!)
        if (dto.getNewPassword() != null && !dto.getNewPassword().isEmpty()) {

            // A. Check if Old Password is provided
            if (dto.getOldPassword() == null || dto.getOldPassword().isEmpty()) {
                throw new RuntimeException("You must enter your current password to change it.");
            }

            // B. Check if Old Password matches the DB hash
            if (!passwordEncoder.matches(dto.getOldPassword(), user.getPasswordHash())) {
                throw new RuntimeException("The current password you entered is incorrect.");
            }

            // C. All good? Hash and Save the NEW password
            user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return mapToDTO(updatedUser);
    }

    // 3. Upload Profile Picture
    public String uploadProfilePicture(String email, MultipartFile file) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create directory if not exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate Unique Filename
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);

            // Save File to Disk
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update Database
            user.setProfilePictureUrl(fileName);
            userRepository.save(user);

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile picture", e);
        }
    }

    public UserDTO getPublicUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Map to DTO but HIDE private info
        return UserDTO.builder()
                .userId(user.getUserId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .bio(user.getBio())
                .profilePictureUrl(user.getProfilePictureUrl())
                .email(null) // 🔒 PRIVACY: Do not return email
                .build();
    }

    // Helper: Map Entity to DTO
    private UserDTO mapToDTO(User u) {
        return UserDTO.builder()
                .userId(u.getUserId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .bio(u.getBio())
                .profilePictureUrl(u.getProfilePictureUrl())
                .build();
    }
}