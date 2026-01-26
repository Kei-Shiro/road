package com.road.project.road_back.auth.dto;

    import lombok.Data;
    import lombok.Builder;
    import lombok.AllArgsConstructor;
    import lombok.NoArgsConstructor;
    import jakarta.validation.constraints.Size;
    import jakarta.validation.constraints.NotBlank;
    import jakarta.validation.constraints.Email;

    /**
     * DTO pour l'inscription d'un utilisateur.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public class RegisterRequest {

        @NotBlank(message = "Le téléphone est obligatoire")
        private String telephone;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
        @NotBlank(message = "Le mot de passe est obligatoire")
        private String password;

        @Email(message = "Format d'email invalide")
        @NotBlank(message = "L'email est obligatoire")
        private String email;
    }