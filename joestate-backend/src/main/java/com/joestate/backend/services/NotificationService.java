package com.joestate.backend.services;

import com.joestate.backend.dto.NotificationDTO;
import com.joestate.backend.entities.Notification;
import com.joestate.backend.entities.Property;
import com.joestate.backend.entities.User;
import com.joestate.backend.repositories.NotificationRepository;
import com.joestate.backend.repositories.PropertyRepository;
import com.joestate.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 1. Generate a Favorite Notification
    @Transactional
    public void createFavoriteNotification(Long propertyId, String buyerEmail) {
        Property property = propertyRepository.findById(propertyId).orElseThrow();
        User sender = userRepository.findByEmail(buyerEmail).orElseThrow();
        User receiver = property.getOwner();

        // Don't notify the owner if they somehow favorite their own property!
        if (sender.getUserId().equals(receiver.getUserId())) return;

        Notification notification = Notification.builder()
                .receiver(receiver)
                .sender(sender)
                .type(Notification.NotificationType.FAVORITE)
                .content(sender.getFirstName() + " added '" + property.getTitle() + "' to their favorites!")
                .relatedId(propertyId)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Instantly BEEP the owner's global WebSocket channel!
        messagingTemplate.convertAndSend("/topic/user/" + receiver.getEmail(), "{\"type\":\"NEW_NOTIFICATION\"}");
    }

    // 2. Fetch Notifications for the Dropdown
    public List<NotificationDTO> getUserNotifications(String email) {
        return notificationRepository.findByReceiver_EmailOrderByCreatedAtDesc(email).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. Mark a specific notification as Read
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElseThrow();
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    // 4. Add this to delete the notification if they un-favorite
    @Transactional
    public void deleteFavoriteNotification(Long propertyId, String senderEmail) {
        notificationRepository.deleteByTypeAndRelatedIdAndSender_Email(
                Notification.NotificationType.FAVORITE, propertyId, senderEmail
        );
    }

    // 5. Add this to mark ALL as read when they open the dropdown
    @Transactional
    public void markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByReceiver_EmailAndIsReadFalse(email);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationDTO mapToDTO(Notification n) {
        return NotificationDTO.builder()
                .notificationId(n.getNotificationId())
                .type(n.getType())
                .content(n.getContent())
                .relatedId(n.getRelatedId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .senderName(n.getSender() != null ? n.getSender().getFirstName() + " " + n.getSender().getLastName() : "System")
                .senderEmail(n.getSender() != null ? n.getSender().getEmail() : null)
                .senderAvatarUrl(n.getSender() != null ? n.getSender().getProfilePictureUrl() : null)
                .build();
    }
}