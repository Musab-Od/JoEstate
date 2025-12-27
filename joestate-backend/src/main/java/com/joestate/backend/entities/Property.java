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

    @Column(name = "date_posted", insertable = false, updatable = false)
    private LocalDateTime datePosted;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<PropertyImage> images;

    public enum PropertyType { APARTMENT, VILLA, HOUSE, CHALET, STUDIO, SHOP, OFFICE, WAREHOUSE, FARM, LAND }
    public enum Purpose { RENT, BUY }
    public enum Status { ACTIVE, SOLD, RENTED }
}