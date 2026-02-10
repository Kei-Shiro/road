package com.road.project.road_back.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse de configuration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfigurationResponse {
    private Long id;
    private String cle;
    private String valeur;
    private String description;
    private LocalDateTime updatedAt;
}
