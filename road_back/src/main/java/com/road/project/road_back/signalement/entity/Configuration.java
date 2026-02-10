package com.road.project.road_back.signalement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité pour stocker les configurations globales de l'application.
 * Notamment le prix par m² forfaitaire pour le calcul du budget.
 */
@Entity
@Table(name = "configurations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Configuration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cle", unique = true, nullable = false)
    private String cle;

    @Column(name = "valeur", nullable = false)
    private String valeur;

    @Column(name = "description")
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Clé pour le prix par m² forfaitaire
     */
    public static final String PRIX_PAR_M2 = "PRIX_PAR_M2";

    /**
     * Valeur par défaut du prix par m² (en Ariary)
     */
    public static final BigDecimal PRIX_PAR_M2_DEFAULT = new BigDecimal("50000");
}

