package com.joestate.backend.dto;

import com.joestate.backend.entities.Notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Long notificationId;
    private NotificationType type;
    private String content;
    private Long relatedId; // The Property ID
    private boolean isRead;
    private LocalDateTime createdAt;

    // Info about the person who triggered it (e.g., the buyer who favorited)
    private String senderName;
    private String senderEmail;
    private String senderAvatarUrl;
}