package com.joestate.backend.repositories;

import com.joestate.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // For Login
    Optional<User> findByEmail(String email);

    // For Verification Flow
    Optional<User> findByVerificationCode(String code);

    // Uniqueness Checks for Registration
    Boolean existsByEmail(String email);

    // For the KPI Dashboard
    long countByBanStatus(User.BanStatus banStatus);

    // For the Hot List
    List<User> findTop5ByOrderByCreatedAtDesc();

    // The Ultimate Admin Search: Checks Email OR Name OR Phone instantly
    @Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR u.phoneNumber LIKE CONCAT('%', :searchTerm, '%')")
    List<User> searchUsersGlobally(@org.springframework.data.repository.query.Param("searchTerm") String searchTerm);
}
