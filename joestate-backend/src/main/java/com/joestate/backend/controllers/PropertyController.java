package com.joestate.backend.controllers;

import com.joestate.backend.dto.PropertyDTO;
import com.joestate.backend.entities.Property;
import com.joestate.backend.services.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<String> createListing(@RequestBody PropertyDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        propertyService.createProperty(dto, userEmail);
        return ResponseEntity.ok("Property Listed Successfully");
    }
}