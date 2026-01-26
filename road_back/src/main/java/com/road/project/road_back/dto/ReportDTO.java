package com.road.project.road_back.dto;

import com.road.project.road_back.entity.ProblemType;
import com.road.project.road_back.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDTO {
    private Long id;
    private Double lat;
    private Double lng;
    private String address;
    private ProblemType type;
    private String description;
    private ReportStatus status;
    private LocalDate date;
    private Double surface;
    private Long budget;
    private String company;
    private Long reportedById;
    private String reportedByName;
}

