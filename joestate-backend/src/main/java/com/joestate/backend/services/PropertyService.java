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
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

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
    // 1. PUBLIC READ METHODS
    // ==========================================

    public List<PropertyDTO> searchProperties(String location, Property.Purpose purpose, Property.PropertyType type, Property.RentFrequency rentFrequency, Double minPrice, Double maxPrice, Integer minArea, Integer maxArea, Integer beds, Integer baths) {
        Set<Long> likedIds = getLikedPropertyIds();
        String loc1 = null, loc2 = null, loc3 = null;
        if (location != null && !location.trim().isEmpty()) {
            String[] words = location.split("[,\\s]+");
            if (words.length > 0) loc1 = words[0];
            if (words.length > 1) loc2 = words[1];
            if (words.length > 2) loc3 = words[2];
        }
        List<Property> properties = propertyRepository.searchProperties(loc1, loc2, loc3, purpose, type, rentFrequency, minPrice, maxPrice, minArea, maxArea, beds, baths);
        return properties.stream().map(p -> mapToDTO(p, likedIds)).collect(Collectors.toList());
    }

    public List<PropertyDTO> getFeaturedProperties() {
        Set<Long> likedIds = getLikedPropertyIds();
        List<Property> props = propertyRepository.getGoldenFeaturedProperties(Property.Status.ACTIVE, PageRequest.of(0, 6));
        return props.stream().map(p -> mapToDTO(p, likedIds)).collect(Collectors.toList());
    }

    public PropertyDTO getPropertyById(Long id) {
        Set<Long> likedIds = getLikedPropertyIds();
        Property property = propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
        return mapToDTO(property, likedIds);
    }

    public List<PropertyDTO> getPublicUserProperties(Long userId) {
        return propertyRepository.findAllByOwner_UserId(userId).stream()
                .filter(p -> p.getStatus() != Property.Status.SUSPENDED)
                .map(p -> mapToDTO(p, Collections.emptySet()))
                .collect(Collectors.toList());
    }

    public List<PropertyDTO> getPropertiesByUser(String email) {
        Set<Long> likedIds = getLikedPropertyIds();
        return propertyRepository.findAllByOwner_Email(email).stream().map(p -> mapToDTO(p, likedIds)).collect(Collectors.toList());
    }

    public List<PropertyDTO> getFavoritesByUser(String email) {
        Set<Long> likedIds = getLikedPropertyIds();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFavorites().stream().map(fav -> mapToDTO(fav.getProperty(), likedIds)).collect(Collectors.toList());
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
            favoriteRepository.delete(existingFav.get());
            notificationService.deleteFavoriteNotification(propertyId, email);
            return false;
        } else {
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            Property property = propertyRepository.findById(propertyId).orElseThrow(() -> new RuntimeException("Property not found"));
            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setProperty(property);
            favoriteRepository.save(favorite);
            notificationService.createFavoriteNotification(propertyId, email);
            return true;
        }
    }

    public void createProperty(PropertyDTO dto, String userEmail) {
        User owner = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));

        if (owner.getBanStatus() == User.BanStatus.MUTE_PUBLISHING || owner.getBanStatus() == User.BanStatus.MUTE_BOTH || owner.getBanStatus() == User.BanStatus.BANNED) {
            throw new RuntimeException("Your account has been restricted from publishing new properties.");
        }

        int photoCount = dto.getImageFiles() != null ? dto.getImageFiles().size() : 0;
        if (!owner.isPremium() && photoCount > 10) throw new RuntimeException("Free accounts are limited to 10 photos.");
        if (owner.isPremium() && photoCount > 50) throw new RuntimeException("Premium accounts are limited to 50 photos.");

        Property property = new Property();
        property.setOwner(owner);
        mapDtoToPropertyFields(property, dto); // <-- FIXES THE 15-LINE DUPLICATION

        Property savedProperty = propertyRepository.save(property);
        saveImages(dto.getImageFiles(), savedProperty);
    }

    // ==========================================
    // 3. UPDATE AND DELETE LOGIC
    // ==========================================

    public void updateProperty(Long id, PropertyDTO dto, String userEmail) {
        Property property = propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to edit this property");
        }

        mapDtoToPropertyFields(property, dto); // <-- REUSES THE HELPER, KEEPING IT CLEAN

        List<PropertyImage> toDelete = property.getImages().stream()
                .filter(img -> dto.getExistingImageUrls() == null || !dto.getExistingImageUrls().contains(img.getImageUrl()))
                .collect(Collectors.toList());

        int keptImagesCount = property.getImages().size() - toDelete.size();
        int newImagesCount = dto.getImageFiles() != null ? dto.getImageFiles().size() : 0;
        int totalImages = keptImagesCount + newImagesCount;

        if (!property.getOwner().isPremium() && totalImages > 10) throw new RuntimeException("Free accounts are limited to 10 photos.");
        if (property.getOwner().isPremium() && totalImages > 50) throw new RuntimeException("Premium accounts are limited to 50 photos.");

        deletePhysicalImages(toDelete);
        property.getImages().removeAll(toDelete);

        if (dto.getImageFiles() != null && !dto.getImageFiles().isEmpty()) {
            saveImages(dto.getImageFiles(), property);
        }

        propertyRepository.save(property);
    }

    public void deleteProperty(Long id, String userEmail) {
        Property property = propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to delete this property");
        }
        deletePhysicalImages(property.getImages());
        propertyRepository.delete(property);
    }

    public void updatePropertyStatus(Long id, Property.Status newStatus, String userEmail) {
        Property property = propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("You do not have permission to change this status");
        }
        property.setStatus(newStatus);
        propertyRepository.save(property);
    }

    // ==========================================
    // 4. PRIVATE HELPERS
    // ==========================================

    // --- REUSABLE HELPER TO FIX IDE WARNING ---
    private void mapDtoToPropertyFields(Property property, PropertyDTO dto) {
        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setArea(dto.getArea());
        property.setLocation(dto.getLocation());
        property.setMapLink(dto.getMapLink()); // <-- NEW GOOGLE MAPS LINK
        property.setRoomCount(dto.getRoomCount());
        property.setBathCount(dto.getBathCount());
        property.setType(dto.getType());
        property.setPurpose(dto.getPurpose());

        if (dto.getPurpose() == Property.Purpose.BUY) {
            property.setRentFrequency(Property.RentFrequency.NONE);
        } else {
            property.setRentFrequency(dto.getRentFrequency());
        }
    }

    private void deletePhysicalImages(List<PropertyImage> images) {
        if (images == null) return;
        Path uploadPath = Paths.get(UPLOAD_DIR);
        for (PropertyImage img : images) {
            try {
                Path filePath = uploadPath.resolve(img.getImageUrl());
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {}
        }
    }

    private Set<Long> getLikedPropertyIds() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) return Collections.emptySet();
        return userRepository.findByEmail(auth.getName())
                .map(user -> user.getFavorites().stream().map(fav -> fav.getProperty().getPropertyId()).collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
    }

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
                .mapLink(p.getMapLink())
                .roomCount(p.getRoomCount())
                .bathCount(p.getBathCount())
                .type(p.getType())
                .purpose(p.getPurpose())
                .status(p.getStatus())
                .rentFrequency(p.getRentFrequency())
                .isPremium(p.getOwner().isPremium())
                .datePosted(p.getDatePosted())
                .imageUrls(p.getImages().stream().map(PropertyImage::getImageUrl).collect(Collectors.toList()))
                .isFavorite(isLiked)
                .ownerEnterpriseName(p.getOwner().getEnterpriseName())
                .ownerIsVerified(p.getOwner().isVerified())
                .viewCount(p.getUniqueViewers() != null ? p.getUniqueViewers().size() : 0)
                .phoneClickCount(p.getUniquePhoneClicks() != null ? p.getUniquePhoneClicks().size() : 0)
                .favoriteCount(p.getFavoritedBy() != null ? p.getFavoritedBy().size() : 0)
                .build();
    }

    private void saveImages(List<MultipartFile> files, Property property) {
        if (files == null || files.isEmpty()) return;
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            boolean isMain = true;
            for (MultipartFile file : files) {
                if (file.isEmpty() || file.getOriginalFilename() == null) continue;
                String lowerName = file.getOriginalFilename().toLowerCase();
                if (!lowerName.matches(".*\\.(jpg|jpeg|png|webp|mp4|webm)$")) {
                    throw new RuntimeException("Invalid file type uploaded. Only Images and MP4/WebM videos are allowed.");
                }
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

                PropertyImage image = new PropertyImage();
                image.setProperty(property);
                image.setImageUrl(fileName);
                image.setMain(isMain);
                isMain = false;
                propertyImageRepository.save(image);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload media files", e);
        }
    }

    // --- ANALYTICS ENGINE ---
    @Transactional
    public void trackView(Long propertyId, String viewerId) {
        propertyRepository.findById(propertyId).ifPresent(property -> {
            property.getUniqueViewers().add(viewerId);
            propertyRepository.save(property);
        });
    }

    @Transactional
    public void trackPhoneClick(Long propertyId, String viewerId) {
        propertyRepository.findById(propertyId).ifPresent(property -> {
            property.getUniquePhoneClicks().add(viewerId);
            propertyRepository.save(property);
        });
    }
}