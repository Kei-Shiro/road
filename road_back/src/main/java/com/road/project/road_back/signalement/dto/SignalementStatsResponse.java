package com.road.project.road_back.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO pour les statistiques des signalements.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementStatsResponse {

    private Long totalSignalements;
    private Long nouveaux;
    private Long enCours;
    private Long termines;
    private Double surfaceTotale; // en m²
    private BigDecimal budgetTotal; // en Ariary
    private Double tauxAvancementMoyen;
    private Map<String, Long> parStatut;
    private List<EntrepriseStats> parEntreprise;

    // Statistiques de traitement moyen
    private TraitementStats traitement;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntrepriseStats {
        private String nom;
        private Long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TraitementStats {
        private Double tempsNouveauAEnCours; // Temps moyen en heures pour passer de NOUVEAU à EN_COURS
        private Double tempsEnCoursATermine; // Temps moyen en heures pour passer de EN_COURS à TERMINE
        private Double tempsTotal; // Temps moyen total en heures (NOUVEAU à TERMINE)
        private Long nombreTravauxTermines;
        private Long nombreTravauxEnCours;
        private Long nombreNouveauxTraitements;
    }
}

