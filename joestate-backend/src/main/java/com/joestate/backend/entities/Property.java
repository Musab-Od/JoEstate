package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.time.LocalDateTime;

@Entity
@Table(name = "properties")
@Getter @Setter
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long propertyId;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Double price;
    private Double area;
    private String location;

    // --- NEW: GOOGLE MAPS LINK ---
    @Column(name = "map_link", length = 500)
    private String mapLink;

    private Integer roomCount;
    private Integer bathCount;

    // --- PHASE 6: CLEAN HASHSET USAGE ---
    @ElementCollection
    @CollectionTable(name = "property_viewers", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "viewer_id")
    private Set<String> uniqueViewers = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "property_phone_clicks", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "viewer_id")
    private Set<String> uniquePhoneClicks = new HashSet<>();

    @Enumerated(EnumType.STRING)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    private Purpose purpose;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Enumerated(EnumType.STRING)
    private RentFrequency rentFrequency;

    @Column(name = "date_posted")
    private LocalDateTime datePosted;

    @PrePersist
    protected void onCreate() {
        datePosted = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Favorite> favoritedBy;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PropertyImage> images;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatThread> chatThreads;

    public enum PropertyType { APARTMENT, VILLA, HOUSE, CHALET, STUDIO, SHOP, OFFICE, WAREHOUSE, FARM, LAND }
    public enum Purpose { RENT, BUY }
    public enum Status { ACTIVE, SOLD, RENTED, SUSPENDED }
    public enum RentFrequency { DAILY, WEEKLY, MONTHLY, YEARLY, NONE }
}