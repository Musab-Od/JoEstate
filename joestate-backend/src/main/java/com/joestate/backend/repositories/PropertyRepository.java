package com.joestate.backend.repositories;

import com.joestate.backend.entities.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    @Query("SELECT p FROM Property p WHERE " +
            "(:loc IS NULL OR p.location LIKE %:loc%) AND " +
            "(:purp IS NULL OR p.purpose = :purp) AND " +
            "(:type IS NULL OR p.type = :type) AND " +
            "(:freq IS NULL OR p.rentFrequency = :freq) AND " +
            "(:minP IS NULL OR p.price >= :minP) AND " +
            "(:maxP IS NULL OR p.price <= :maxP) AND " +
            "(:minA IS NULL OR p.area >= :minA) AND " +
            "(:maxA IS NULL OR p.area <= :maxA) AND " +
            "(:beds IS NULL OR p.roomCount >= :beds) AND " +
            "(:baths IS NULL OR p.bathCount >= :baths) AND " +
            "(p.status = 'ACTIVE')")
    List<Property> searchProperties(
            @Param("loc") String location,
            @Param("purp") Property.Purpose purpose,
            @Param("type") Property.PropertyType type,
            @Param("freq") Property.RentFrequency frequency,
            @Param("minP") Double minPrice,
            @Param("maxP") Double maxPrice,
            @Param("minA") Integer minArea,
            @Param("maxA") Integer maxArea,
            @Param("beds") Integer beds,
            @Param("baths") Integer baths
    );

    @Query("SELECT DISTINCT p.location FROM Property p WHERE LOWER(p.location) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findDistinctLocations(@Param("query") String query);

    List<Property> findTop3ByStatusOrderByDatePostedDesc(Property.Status status);

    List<Property> findAllByOwner_Email(String email); // Finds all houses owned by this user

    List<Property> findAllByOwner_UserId(Long userId);
}