package com.joestate.backend.dto;

import com.joestate.backend.entities.Property.PropertyType;
import com.joestate.backend.entities.Property.Purpose;
import com.joestate.backend.entities.Property.RentFrequency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PropertyDTO {
    private Long propertyId;

    private Long ownerId;
    private String ownerName;
    private String ownerPhone;

    private String title;
    private String description;
    @Positive(message = "Price must be positive")
    private Double price;
    @Min(value = 1, message = "Area must be at least 1 square meter")
    private Double area;
    private String location;
    private Integer roomCount;
    private Integer bathCount;
    private Boolean isFavorite;
    private PropertyType type;
    private Purpose purpose;
    private RentFrequency rentFrequency;
    private String ownerProfilePictureUrl;

    private List<String> imageUrls;

    @JsonIgnore
    private List<MultipartFile> imageFiles;

    private LocalDateTime datePosted;
}