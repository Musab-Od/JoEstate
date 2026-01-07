package com.joestate.backend.controllers;

import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.entities.Property;
import com.joestate.backend.services.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping("/search")
    public ResponseEntity<List<PropertyDTO>> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Property.Purpose purpose,
            @RequestParam(required = false) Property.PropertyType type,
            @RequestParam(required = false) Property.RentFrequency rentFrequency,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minArea,
            @RequestParam(required = false) Integer maxArea,
            @RequestParam(required = false) Integer beds,
            @RequestParam(required = false) Integer baths
    ) {
        return ResponseEntity.ok(propertyService.searchProperties(
                location, purpose, type, rentFrequency, minPrice, maxPrice, minArea, maxArea, beds, baths
        ));
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    // @ModelAttribute so Spring knows to bind the Form fields to DTO
    public ResponseEntity<String> createListing(@ModelAttribute PropertyDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        propertyService.createProperty(dto, userEmail);
        return ResponseEntity.ok("Property Listed Successfully");
    }

    // Endpoint for location autocomplete
    @GetMapping("/locations")
    public ResponseEntity<List<String>> getLocations(@RequestParam String query) {
        if (query == null || query.length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        // Call the SERVICE, not the Repository
        return ResponseEntity.ok(propertyService.getLocationSuggestions(query));
    }

    // Endpoint for featured properties
    @GetMapping("/featured")
    public ResponseEntity<List<PropertyDTO>> getFeatured() {
        return ResponseEntity.ok(propertyService.getFeaturedProperties());
    }

    // Endpoint to get property by ID
    @GetMapping("/{id}")
    public ResponseEntity<PropertyDTO> getPropertyById(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.getPropertyById(id));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Boolean> toggleFavorite(@PathVariable Long id) {
        // 1. Get the logged-in user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 2. Extra safety check (though SecurityConfig likely handles this)
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 3. Call the Service
        boolean isNowFavorite = propertyService.toggleFavorite(id, auth.getName());

        // 4. Return the new state (true = liked, false = unliked)
        return ResponseEntity.ok(isNowFavorite);
    }

    // GET /api/properties/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PropertyDTO>> getUserProperties(@PathVariable Long userId) {
        return ResponseEntity.ok(propertyService.getPublicUserProperties(userId));
    }
}