package com.joestate.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_images")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @ManyToOne // Many images belong to one Property
    @JoinColumn(name = "property_id")
    private Property property;

    @Column(nullable = false)
    private String imageUrl;

    private boolean isMain = false;
}