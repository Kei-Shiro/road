package com.road.project.road_back.auth.entity;

/**
 * Enumération des rôles utilisateur dans l'application.
 * Mappé depuis Firebase où role est stocké comme String.
 */
public enum Role {
    MANAGER,
    ADMIN,
    UTILISATEUR,
    VISITEUR
}