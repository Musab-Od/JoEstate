package com.joestate.backend.services;

import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.User;
import com.joestate.backend.entities.PropertyImage;
import com.joestate.backend.entities.Favorite;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.UserRepository;
import com.joestate.backend.repositories.PropertyImageRepository;
import com.joestate.backend.repositories.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final FavoriteRepository favoriteRepository;

    private final NotificationService notificationService;

    private final String UPLOAD_DIR = "uploads/";

    // ==========================================
    // 1. PUBLIC READ METHODS (With Fav Logic)
    // ==========================================

    public List<PropertyDTO> searchProperties(
            String location, Property.Purpose purpose, Property.PropertyType type,
            Property.RentFrequency rentFrequency, Double minPrice, Double maxPrice,
            Integer minArea, Integer maxArea, Integer beds, Integer baths
    ) {
        Set<Long> likedIds = getLikedPropertyIds(); // Fetch once for efficiency
        List<Property> properties = propertyRepository.searchProperties(
                location, purpose, type, rentFrequency, minPrice, maxPrice, minArea, maxArea, beds, baths
        );
        return properties.stream().map(p -> mapToDTO(p, likedIds)).collect(Collectors.toList());
    }

    public List<PropertyDTO> getFeaturedProperties() {
        Set<Long> likedIds = getLikedPropertyIds();
        List<Property> props = propertyRepository.findTop3ByStatusOrderByDatePostedDesc(Property.Status.ACTIVE);
        return props.stream().map(p -> mapToDTO(p, likedIds)).collect(Collectors.toList());
    }

    public PropertyDTO getPropertyById(Long id) {
        Set<Long> likedIds = getLikedPropertyIds();
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return mapToDTO(property, likedIds);
    }

    public List<PropertyDTO> getPublicUserProperties(Long userId) {
        // We don't check for 'liked' status here (or we can pass empty set)
        // because public profiles are usually viewed by others.
        // For simplicity, we just return the basic DTOs.
        return propertyRepository.findAllByOwner_UserId(userId)
                .stream()
                .filter(p -> p.getStatus() != Property.Status.SUSPENDED)
                .map(p -> mapToDTO(p, Collections.emptySet()))
                .collect(Collectors.toList());
    }

    // My Listings
    public List<PropertyDTO> getPropertiesByUser(String email) {
        Set<Long> likedIds = getLikedPropertyIds();
        return propertyRepository.findAllByOwner_Email(email)
                .stream()
                .map(p -> mapToDTO(p, likedIds))
                .collect(Collectors.toList());
    }

    // My Favorites
    public List<PropertyDTO> getFavoritesByUser(String email) {
        Set<Long> likedIds = getLikedPropertyIds();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getFavorites().stream()
                .map(fav -> mapToDTO(fav.getProperty(), likedIds))
                .collect(Collectors.toList());
    }

    public List<String> getLocationSuggestions(String query) {
        List<String> locations = propertyRepository.findDistinctLocations(query);
        return locations.size() > 5 ? locations.subList(0, 5) : locations;
    }

    // ==========================================
    // 2. WRITE METHODS (Create, Like)
    // ==========================================

    public boolean toggleFavorite(Long propertyId, String email) {
        Optional<Favorite> existingFav = favoriteRepository.findByUser_EmailAndProperty_PropertyId(email, propertyId);

        if (existingFav.isPresent()) {
            // --- SCENARIO 1: THEY UN-FAVORITED THE PROPERTY ---
            favoriteRepository.delete(existingFav.get());

            // Delete the notification so it disappears from the owner's bell!
            notificationService.deleteFavoriteNotification(propertyId, email);

            return false; // Result: Unliked

        } else {
            // --- SCENARIO 2: THEY FAVORITED THE PROPERTY ---
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Property property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new RuntimeException("Property not found"));

            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setProperty(property);
            favoriteRepository.save(favorite);

            // Fire the notification to the owner!
            notificationService.createFavoriteNotification(propertyId, email);

            return true; // Result: Liked
        }
    }

    public void createProperty(PropertyDTO dto, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = new Property();
        property.setOwner(owner);
        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setArea(dto.getArea());
        property.setLocation(dto.getLocation());
        property.setRoomCount(dto.getRoomCount());
        property.setBathCount(dto.getBathCount());
        property.setType(dto.getType());
        property.setPurpose(dto.getPurpose());

        if (dto.getPurpose() == Property.Purpose.BUY) {
            property.setRentFrequency(Property.RentFrequency.NONE);
        } else {
            property.setRentFrequency(dto.getRentFrequency());
        }

        Property savedProperty = propertyRepository.save(property);
        saveImages(dto.getImageFiles(), savedProperty);
    }

    // ==========================================
    // 3. UPDATE AND DELETE LOGIC
    // ==========================================

    public void updateProperty(Long id, PropertyDTO dto, String userEmail) {
        // 1. Find the property
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // 2. Verify Ownership
        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to edit this property");
        }

        // 3. Update Text Fields
        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setArea(dto.getArea());
        property.setLocation(dto.getLocation());
        property.setRoomCount(dto.getRoomCount());
        property.setBathCount(dto.getBathCount());
        property.setType(dto.getType());
        property.setPurpose(dto.getPurpose());

        if (dto.getPurpose() == Property.Purpose.BUY) {
            property.setRentFrequency(Property.RentFrequency.NONE);
        } else {
            property.setRentFrequency(dto.getRentFrequency());
        }

        // 1. Identify which images to DELETE (those not in the 'keep' list)
        List<PropertyImage> toDelete = property.getImages().stream()
                .filter(img -> dto.getExistingImageUrls() == null ||
                        !dto.getExistingImageUrls().contains(img.getImageUrl()))
                .collect(Collectors.toList());

        // 2. Remove them from disk and the DB list
        deletePhysicalImages(toDelete);
        property.getImages().removeAll(toDelete);

        // 3. Add any NEW images uploaded
        if (dto.getImageFiles() != null && !dto.getImageFiles().isEmpty()) {
            saveImages(dto.getImageFiles(), property);
        }

        propertyRepository.save(property);
    }

    public void deleteProperty(Long id, String userEmail) {
        // 1. Find the property
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // 2. Verify Ownership
        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to delete this property");
        }

        // 3. Delete physical image files from the hard drive
        deletePhysicalImages(property.getImages());

        // 4. Delete the property (CascadeType.ALL will automatically delete DB rows for Images & Favorites)
        propertyRepository.delete(property);
    }
        // 5. Change property status
    public void updatePropertyStatus(Long id, Property.Status newStatus, String userEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to change this status");
        }

        property.setStatus(newStatus);
        propertyRepository.save(property);
    }

    // Helper: Deletes files from the disk to save space
    private void deletePhysicalImages(List<PropertyImage> images) {
        if (images == null) return;
        Path uploadPath = Paths.get(UPLOAD_DIR);
        for (PropertyImage img : images) {
            try {
                Path filePath = uploadPath.resolve(img.getImageUrl());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.out.println("Could not delete file: " + img.getImageUrl());
            }
        }
    }

    // ==========================================
    // 4. PRIVATE HELPERS
    // ==========================================

    // Helper: Find IDs of properties liked by the currently logged-in user
    private Set<Long> getLikedPropertyIds() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Collections.emptySet();
        }

        String email = auth.getName();
        // We use a SET for O(1) lookup performance
        return userRepository.findByEmail(email)
                .map(user -> user.getFavorites().stream()
                        .map(fav -> fav.getProperty().getPropertyId())
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

    // Helper: Map Entity to DTO (Injects isFavorite status)
    private PropertyDTO mapToDTO(Property p, Set<Long> likedIds) {
        boolean isLiked = likedIds.contains(p.getPropertyId());

        return PropertyDTO.builder()
                .propertyId(p.getPropertyId())
                .ownerId(p.getOwner().getUserId())
                .ownerName(p.getOwner().getFirstName() + " " + p.getOwner().getLastName())
                .ownerPhone(p.getOwner().getPhoneNumber())
                .ownerProfilePictureUrl(p.getOwner().getProfilePictureUrl())
                .title(p.getTitle())
                .description(p.getDescription())
                .price(p.getPrice())
                .area(p.getArea())
                .location(p.getLocation())
                .roomCount(p.getRoomCount())
                .bathCount(p.getBathCount())
                .type(p.getType())
                .purpose(p.getPurpose())
                .status(p.getStatus())
                .rentFrequency(p.getRentFrequency())
                .datePosted(p.getDatePosted())
                .imageUrls(p.getImages().stream().map(PropertyImage::getImageUrl).collect(Collectors.toList()))
                .isFavorite(isLiked)
                .build();
    }

    // Helper: Save Images to Disk & DB
    private void saveImages(List<MultipartFile> files, Property property) {
        if (files == null || files.isEmpty()) return;

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            boolean isMain = true;
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

                PropertyImage image = new PropertyImage();
                image.setProperty(property);
                image.setImageUrl(fileName);
                image.setMain(isMain);
                propertyImageRepository.save(image);
                isMain = false;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload images", e);
        }
    }
}