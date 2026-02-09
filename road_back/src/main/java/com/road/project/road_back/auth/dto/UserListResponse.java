package com.road.project.road_back.auth.dto;

import com.road.project.road_back.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour lister les utilisateurs (Admin/Manager).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserListResponse {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private Role role;
    private Boolean isLocked;
    private Boolean isOnline;
    private Boolean isActive;
    private Integer loginAttempts;
    private LocalDateTime lockedAt;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}

