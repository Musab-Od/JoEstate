package com.joestate.backend.repositories;

import com.joestate.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // For Login
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // For Verification Flow
    Optional<User> findByVerificationCode(String code);

    // Uniqueness Checks for Registration
    Boolean existsByEmail(String email);
    Boolean existsByUsername(String username);

    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);
}
