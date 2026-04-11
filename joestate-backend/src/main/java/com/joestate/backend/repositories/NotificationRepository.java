package com.joestate.backend.repositories;

import com.joestate.backend.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Fetch all notifications for a specific user, newest first
    List<Notification> findByReceiver_EmailOrderByCreatedAtDesc(String email);

    // Count only the unread ones for the little red badge
    long countByReceiver_EmailAndIsReadFalse(String email);

    // Delete notification if user un-favorites
    void deleteByTypeAndRelatedIdAndSender_Email(Notification.NotificationType type, Long relatedId, String email);

    // Find all unread
    List<Notification> findByReceiver_EmailAndIsReadFalse(String email);
}