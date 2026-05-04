package com.joestate.backend.services;

import com.joestate.backend.entities.Subscription;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.SubscriptionRepository;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionCronJob {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    // This runs automatically every day at Midnight (00:00:00)
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processExpiredSubscriptions() {
        System.out.println("Running nightly subscription audit...");

        // 1. Find all active subscriptions where the end date has passed
        List<Subscription> expiredSubs = subscriptionRepository.findAll().stream()
                .filter(Subscription::isActive)
                .filter(sub -> sub.getEndDate().isBefore(LocalDateTime.now()))
                .toList();

        for (Subscription sub : expiredSubs) {
            // 2. Mark the subscription as inactive
            sub.setActive(false);
            subscriptionRepository.save(sub);

            // 3. Strip the user of their Premium status
            User user = sub.getUser();
            user.setPremium(false);
            user.setVerified(false);
            user.setEnterpriseName(null);

            userRepository.save(user);

            System.out.println("Downgraded user: " + user.getEmail() + " due to expired subscription.");
        }
    }
}