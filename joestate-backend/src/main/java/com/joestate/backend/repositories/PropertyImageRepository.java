package com.joestate.backend.repositories;

import com.joestate.backend.entities.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {

    // To fetch images for a specific property gallery
    List<PropertyImage> findByPropertyPropertyId(Long propertyId);
}