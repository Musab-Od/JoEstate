package com.joestate.backend.services;

import com.joestate.backend.entities.Subscription;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.SubscriptionRepository;
import com.joestate.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionCronJobTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SubscriptionCronJob cronJob;

    private User targetUser;
    private Subscription expiredSubscription;
    private Subscription activeSubscription;
    private Subscription alreadyInactiveSubscription;

    @BeforeEach
    void setUp() {
        // 1. Setup a User who currently has Premium and Verification
        targetUser = new User();
        targetUser.setEmail("premium@joestate.com");
        targetUser.setPremium(true);
        targetUser.setVerified(true);
        targetUser.setEnterpriseName("Golden Real Estate");

        // 2. Setup Scenario A: An Active subscription that EXPIRED yesterday
        expiredSubscription = new Subscription();
        expiredSubscription.setUser(targetUser);
        expiredSubscription.setActive(true);
        expiredSubscription.setEndDate(LocalDateTime.now().minusDays(1)); // Expired!

        // 3. Setup Scenario B: An Active subscription that is STILL GOOD for 30 days
        activeSubscription = new Subscription();
        activeSubscription.setUser(new User());
        activeSubscription.setActive(true);
        activeSubscription.setEndDate(LocalDateTime.now().plusDays(30)); // Still valid

        // 4. Setup Scenario C: An already INACTIVE subscription
        alreadyInactiveSubscription = new Subscription();
        alreadyInactiveSubscription.setUser(new User());
        alreadyInactiveSubscription.setActive(false);
        alreadyInactiveSubscription.setEndDate(LocalDateTime.now().minusDays(10));
    }

    @Test
    void processExpiredSubscriptions_SuccessfullyDowngradesExpiredUsers() {
        // Arrange: The database returns a mix of subscriptions
        when(subscriptionRepository.findAll()).thenReturn(List.of(
                expiredSubscription,
                activeSubscription,
                alreadyInactiveSubscription
        ));

        // Act: Manually trigger the Cron Job
        cronJob.processExpiredSubscriptions();

        // Assert 1: Verify the EXPIRED subscription was turned off
        assertFalse(expiredSubscription.isActive(), "Expired subscription should be marked inactive");

        // Assert 2: Verify the USER lost all their perks
        assertFalse(targetUser.isPremium(), "User should lose Premium status");
        assertFalse(targetUser.isVerified(), "User should lose Verified badge");
        assertNull(targetUser.getEnterpriseName(), "Enterprise name should be stripped");

        // Assert 3: Verify the database save methods were called EXACTLY ONCE
        // (Because only ONE out of the three subscriptions actually met the criteria)
        verify(subscriptionRepository, times(1)).save(expiredSubscription);
        verify(userRepository, times(1)).save(targetUser);
    }

    @Test
    void processExpiredSubscriptions_DoesNothing_WhenNoSubscriptionsAreExpired() {
        // Arrange: Database only returns valid or already inactive subscriptions
        when(subscriptionRepository.findAll()).thenReturn(List.of(
                activeSubscription,
                alreadyInactiveSubscription
        ));

        // Act
        cronJob.processExpiredSubscriptions();

        // Assert: Ensure NO saves were accidentally triggered
        verify(subscriptionRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }
}