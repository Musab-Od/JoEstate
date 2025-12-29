package com.joestate.backend.services;

import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.User;
import com.joestate.backend.entities.PropertyImage;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.UserRepository;
import com.joestate.backend.repositories.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyImageRepository propertyImageRepository;

    // Dynamic Search
    public List<PropertyDTO> searchProperties(
            String location,
            Property.Purpose purpose,
            Property.PropertyType type,
            Property.RentFrequency rentFrequency,
            Double minPrice,
            Double maxPrice,
            Integer minArea,
            Integer maxArea,
            Integer beds,
            Integer baths
    ) {
        // 1. Call the Repo
        List<Property> properties = propertyRepository.searchProperties(
                location, purpose, type, rentFrequency, minPrice, maxPrice, minArea, maxArea, beds, baths
        );

        // 2. Convert Entities -> DTOs
        return properties.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Add a new Property
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

        // LOGIC: If selling (BUY), force RentFrequency to NONE
        if (dto.getPurpose() == Property.Purpose.BUY) {
            property.setRentFrequency(Property.RentFrequency.NONE);
        } else {
            property.setRentFrequency(dto.getRentFrequency());
        }

        // Status is ACTIVE by default (defined in Entity)
        // DatePosted is Automatic (defined in DB/Entity)

        Property savedProperty = propertyRepository.save(property);

        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                String url = dto.getImageUrls().get(i);

                PropertyImage image = new PropertyImage();
                image.setProperty(savedProperty);
                image.setImageUrl(url);

                // LOGIC: The first image (index 0) is the Thumbnail (Main)
                if (i == 0) {
                    image.setMain(true);
                } else {
                    image.setMain(false);
                }

                propertyImageRepository.save(image);
            }
        }
    }

    private PropertyDTO mapToDTO(Property p) {
        return PropertyDTO.builder()
                .propertyId(p.getPropertyId())
                .ownerId(p.getOwner().getUserId())
                // Handle potential null pointer if owner is deleted, though database constraints usually prevent this
                .ownerName(p.getOwner().getFirstName() + " " + p.getOwner().getLastName())
                .title(p.getTitle())
                .description(p.getDescription())
                .price(p.getPrice())
                .area(p.getArea())
                .location(p.getLocation())
                .roomCount(p.getRoomCount())
                .bathCount(p.getBathCount())
                .type(p.getType())
                .purpose(p.getPurpose())
                .rentFrequency(p.getRentFrequency())
                .datePosted(p.getDatePosted())
                .imageUrls(p.getImages().stream().map(img -> img.getImageUrl()).collect(Collectors.toList())) // Map images too!
                .build();
    }
}