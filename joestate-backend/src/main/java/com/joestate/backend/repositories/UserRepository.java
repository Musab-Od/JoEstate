package com.joestate.backend.repositories;

import com.joestate.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // For Login (F1)
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // For Verification Flow
    Optional<User> findByVerificationCode(String code);

    // Uniqueness Checks for Registration
    Boolean existsByEmail(String email);
    Boolean existsByUsername(String username);
}
