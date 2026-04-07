package com.joestate.backend.dto;

import com.joestate.backend.entities.Property.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatThreadDTO {
    private Long threadId;

    // --- Property Info (For the header and off-market logic) ---
    private Long propertyId;
    private String propertyTitle;
    private String propertyImageUrl;
    private Status propertyStatus;
    private Double propertyPrice;

    // --- The "Other" Person (Who am I talking to?) ---
    private Long otherUserId;
    private String otherUserName;
    private String otherUserAvatarUrl;

    // --- Inbox Preview Info ---
    private String lastMessage;
    private LocalDateTime lastUpdatedAt;
    private long unreadCount; // Red notification bubble number!
}