package com.road.project.road_back.signalement.entity;

import com.road.project.road_back.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entité représentant un signalement de travaux routiers.
 */
@Entity
@Table(name = "signalements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column
    private String adresse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutSignalement statut = StatutSignalement.NOUVEAU;

    @Column(name = "surface_impactee")
    private Double surfaceImpactee; // en m²

    @Column(precision = 15, scale = 2)
    private BigDecimal budget; // en Ariary

    @Column(name = "entreprise_responsable")
    private String entrepriseResponsable;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin_prevue")
    private LocalDate dateFinPrevue;

    @Column(name = "date_fin_reelle")
    private LocalDate dateFinReelle;

    @Column(name = "date_nouveau")
    private LocalDateTime dateNouveau; // Date de création (statut NOUVEAU = 0%)

    @Column(name = "date_en_cours")
    private LocalDateTime dateEnCours; // Date de passage en cours (statut EN_COURS = 50%)

    @Column(name = "date_termine")
    private LocalDateTime dateTermine; // Date de fin (statut TERMINE = 100%)

    @Column(name = "pourcentage_avancement")
    @Builder.Default
    private Integer pourcentageAvancement = 0;

    @Column
    private String priorite; // BASSE, MOYENNE, HAUTE, URGENTE

    @Column
    private String type; // REPARATION, CONSTRUCTION, ENTRETIEN, EXTENSION

    @Column(name = "photo_url")
    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "sync_id", unique = true)
    private String syncId; // UUID pour synchronisation offline

    @Column(name = "is_synced")
    @Builder.Default
    private Boolean isSynced = true;

    @Column(name = "local_updated_at")
    private LocalDateTime localUpdatedAt; // Pour résolution de conflits

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

