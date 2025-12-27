package com.joestate.backend.repositories;

import com.joestate.backend.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserUserId(Long userId); // Get all favorites for a user
    void deleteByUserUserIdAndPropertyPropertyId(Long userId, Long propertyId); // Remove favorite
    boolean existsByUserUserIdAndPropertyPropertyId(Long userId, Long propertyId);
}