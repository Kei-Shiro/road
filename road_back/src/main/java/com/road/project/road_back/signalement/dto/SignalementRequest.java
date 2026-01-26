package com.road.project.road_back.signalement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.road.project.road_back.signalement.entity.StatutSignalement;

/**
 * DTO pour la création d'un signalement.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalementRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "La latitude est obligatoire")
    private Double latitude;

    @NotNull(message = "La longitude est obligatoire")
    private Double longitude;

    private String adresse;

    private StatutSignalement statut;

    private Double surfaceImpactee;

    private BigDecimal budget;

    private String entrepriseResponsable;

    private LocalDate dateDebut;

    private LocalDate dateFinPrevue;

    private LocalDate dateFinReelle;

    private Integer pourcentageAvancement;

    private String priorite;

    private String type;

    private String photoUrl;

    /* ===== Synchronisation offline ===== */

    private String syncId;

    private LocalDateTime localUpdatedAt;
}
