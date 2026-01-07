package com.joestate.backend.repositories;

import com.joestate.backend.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUser_EmailAndProperty_PropertyId(String email, Long propertyId);
}