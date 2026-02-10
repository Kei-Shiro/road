package com.road.project.road_back.signalement.dto;

import com.road.project.road_back.signalement.entity.StatutSignalement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO pour la réponse d'un signalement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementResponse {

    private Long id;
    private String titre;
    private String description;
    private Double latitude;
    private Double longitude;
    private String adresse;
    private StatutSignalement statut;
    private Double surfaceImpactee;
    private Integer niveau;
    private BigDecimal budget;
    private String entrepriseResponsable;
    private LocalDate dateDebut;
    private LocalDate dateFinPrevue;
    private LocalDate dateFinReelle;
    private LocalDateTime dateNouveau;
    private LocalDateTime dateEnCours;
    private LocalDateTime dateTermine;
    private Integer pourcentageAvancement;
    private String priorite;
    private String type;
    private String photoUrl;
    private String syncId;
    private Boolean isSynced;
    private LocalDateTime localUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserSummary createdBy;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
    }
}

