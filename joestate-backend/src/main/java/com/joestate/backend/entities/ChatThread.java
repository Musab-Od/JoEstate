package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chat_threads")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long threadId;

    // The property this chat is about
    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // The user who started the chat (the potential buyer/renter)
    @ManyToOne
    @JoinColumn(name = "inquirer_id", nullable = false)
    private User inquirer;

    // All the messages in this thread
    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages;

    private LocalDateTime createdAt;

    // We use this to sort the inbox so the most recent chats jump to the top!
    private LocalDateTime lastUpdatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdatedAt = LocalDateTime.now();
    }
}