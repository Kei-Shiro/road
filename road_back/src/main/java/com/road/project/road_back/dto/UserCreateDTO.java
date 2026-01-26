package com.road.project.road_back.dto;

import com.road.project.road_back.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreateDTO {
    private String name;
    private String email;
    private String password;
    private UserRole role;
}

