package com.joestate.backend.repositories;

import com.joestate.backend.entities.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    // Quickly check if a user already has an active subscription
    Optional<Subscription> findByUser_EmailAndIsActiveTrue(String email);
}