package com.road.project.road_back.auth.dto;

import com.road.project.road_back.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse d'authentification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserDto user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String nom;
        private String prenom;
        private String telephone;
        private Role role;
        private Boolean isOnline;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
    }
}

