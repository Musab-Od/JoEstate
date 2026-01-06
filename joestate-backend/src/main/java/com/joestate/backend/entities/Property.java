package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "properties")
@Getter @Setter
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long propertyId;

    @ManyToOne
    @JoinColumn(name = "owner_id") // Links to users table
    private User owner;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Double price;
    private Double area;
    private String location;
    private Integer roomCount;
    private Integer bathCount;

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

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<Favorite> favoritedBy;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<PropertyImage> images;

    public enum PropertyType { APARTMENT, VILLA, HOUSE, CHALET, STUDIO, SHOP, OFFICE, WAREHOUSE, FARM, LAND }
    public enum Purpose { RENT, BUY }
    public enum Status { ACTIVE, SOLD, RENTED }
    public enum RentFrequency { DAILY, WEEKLY, MONTHLY, YEARLY, NONE }
}