package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private String bio;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    private boolean isVerified = false;

    @Column(nullable = false)
    private boolean isPremium = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BanStatus banStatus = BanStatus.NONE;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Property> properties;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Favorite> favorites;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    private String verificationCode;

    public enum Role {
        USER,
        ADMIN,
        PREMIUM
    }
    public enum BanStatus {
        NONE,               // Fully active
        MUTE_MESSAGES,      // Cannot send chat messages
        MUTE_PUBLISHING,    // Cannot post new properties
        MUTE_BOTH,          // Cannot send messages or post properties, but can still log in and browse
        BANNED              // Completely blocked from logging in
    }
}
