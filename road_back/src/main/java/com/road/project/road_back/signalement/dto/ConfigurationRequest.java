package com.road.project.road_back.signalement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO pour la mise à jour de configuration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfigurationRequest {

    @NotBlank(message = "La clé est obligatoire")
    private String cle;

    @NotBlank(message = "La valeur est obligatoire")
    private String valeur;

    private String description;
}

