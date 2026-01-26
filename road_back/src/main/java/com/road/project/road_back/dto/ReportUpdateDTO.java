package com.road.project.road_back.dto;

import com.road.project.road_back.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportUpdateDTO {
    private String address;
    private ReportStatus status;
    private Double surface;
    private Long budget;
    private String company;
}

