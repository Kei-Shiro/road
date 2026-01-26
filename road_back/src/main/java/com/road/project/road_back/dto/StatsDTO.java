package com.road.project.road_back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsDTO {
    private Integer total;
    private Integer nouveau;
    private Integer enCours;
    private Integer termine;
    private Double totalSurface;
    private Long totalBudget;
    private Integer progress;
}

