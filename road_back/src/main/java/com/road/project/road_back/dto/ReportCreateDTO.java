package com.road.project.road_back.dto;

import com.road.project.road_back.entity.ProblemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportCreateDTO {
    private Double lat;
    private Double lng;
    private String address;
    private ProblemType type;
    private String description;
    private Long reportedById;
}

