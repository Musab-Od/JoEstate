package com.joestate.backend.controllers;

import com.joestate.backend.dto.PaymentRequest;
import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.dto.UserDTO;
import com.joestate.backend.dto.VerificationRequestDTO;
import com.joestate.backend.services.PropertyService;
import com.joestate.backend.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PropertyService propertyService;

    // 1. Get My Profile
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentUser(authentication.getName()));
    }

    // 2. Update Profile
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateProfile(Authentication authentication, @Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), dto));
    }

    // 3. Upload Avatar
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadAvatar(Authentication authentication, @RequestParam("file") MultipartFile file) {
        String fileName = userService.uploadProfilePicture(authentication.getName(), file);
        return ResponseEntity.ok(fileName);
    }

    // 3.5 Upgrade to Premium (Mock Checkout)
    @PostMapping("/me/upgrade")
    public ResponseEntity<String> upgradeToPremium(
            Authentication authentication,
            @RequestBody PaymentRequest request) {

        userService.upgradeToPremium(authentication.getName(), request);
        return ResponseEntity.ok("Payment Successful! Welcome to Premium.");
    }

    // 4. Get My Properties
    @GetMapping("/me/properties")
    public ResponseEntity<List<PropertyDTO>> getMyProperties(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getPropertiesByUser(authentication.getName()));
    }

    // 5. Get My Favorites
    @GetMapping("/me/favorites")
    public ResponseEntity<List<PropertyDTO>> getMyFavorites(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getFavoritesByUser(authentication.getName()));
    }

    // 6. Submit Enterprise Verification Ticket
    @PostMapping(value = "/me/verification", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> submitVerificationRequest(
            Authentication authentication,
            @RequestParam("file") MultipartFile documentFile,
            @RequestParam("message") String userMessage,
            @RequestParam(value = "enterpriseName", required = false) String enterpriseName) {

        userService.submitVerificationTicket(authentication.getName(), documentFile, userMessage, enterpriseName);
        return ResponseEntity.ok("Verification ticket submitted successfully.");
    }

    // 7. Get My Verification Ticket Status
    @GetMapping("/me/verification")
    public ResponseEntity<VerificationRequestDTO> getMyVerificationTicket(Authentication authentication) {
        VerificationRequestDTO ticket = userService.getMyVerificationTicket(authentication.getName());
        if (ticket == null) {
            return ResponseEntity.noContent().build(); // 204 No Content if no ticket exists
        }
        return ResponseEntity.ok(ticket);
    }

    // GET /api/users/{id} (Public Profile)
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getPublicUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getPublicUserProfile(id));
    }
}