package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    // The user receiving the alert (e.g., The Property Owner)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    // The user who triggered the alert (e.g., The Buyer who clicked Favorite)
    // We include this so we can show their avatar in the dropdown!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    public enum NotificationType {
        FAVORITE,
        SYSTEM_ALERT
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // E.g., "Musab added your property to their favorites!"
    @Column(nullable = false)
    private String content;

    // The ID of whatever this notification is about (The Property ID)
    private Long relatedId;

    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}