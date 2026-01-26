package com.road.project.road_back.dto;

import com.road.project.road_back.entity.UserRole;
import com.road.project.road_back.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private UserStatus status;
    private LocalDate dateCreated;
    private Integer reportsCount;
}

