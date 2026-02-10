package com.road.project.road_back.auth.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.road.project.road_back.auth.dto.RegisterRequest;
import com.road.project.road_back.auth.dto.UpdateProfileRequest;
import com.road.project.road_back.auth.entity.Role;
import com.road.project.road_back.auth.entity.User;
import com.road.project.road_back.config.FirebaseConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Service pour gérer les utilisateurs dans Firebase.
 * 
 * Architecture :
 * - Firebase Authentication : Gère l'authentification (email/password)
 * - Firestore (collection 'users') : Stocke les données additionnelles (nom, prénom, rôle, etc.)
 * 
 * Le mot de passe n'est JAMAIS stocké dans Firestore, il est géré par Firebase Auth.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseUserService {

    private final FirebaseConfig firebaseConfig;
    
    private static final String USERS_COLLECTION = "users";
    private static final int TIMEOUT_SECONDS = 10;

    /**
     * Vérifie si une connexion Internet est disponible et Firebase initialisé.
     */
    public boolean isOnline() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("8.8.8.8", 53), 3000);
            return firebaseConfig.isFirebaseInitialized();
        } catch (Exception e) {
            log.debug("Pas de connexion Internet détectée: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Récupère FirebaseAuth instance.
     */
    private FirebaseAuth getFirebaseAuth() {
        try {
            return FirebaseAuth.getInstance();
        } catch (Exception e) {
            log.warn("FirebaseAuth non disponible: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Récupère le Firestore, retourne null si non disponible.
     */
    private Firestore getFirestore() {
        try {
            return com.google.firebase.cloud.FirestoreClient.getFirestore();
        } catch (Exception e) {
            log.warn("Firestore non disponible: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Crée un nouvel utilisateur dans Firebase lors de l'inscription.
     * 1. Crée l'utilisateur dans Firebase Authentication (email/password)
     * 2. Crée les données additionnelles dans Firestore (nom, prénom, rôle, etc.)
     */
    public Optional<String> createUserInFirebase(RegisterRequest request) {
        if (!isOnline()) {
            log.info("Mode hors ligne - Inscription locale uniquement");
            return Optional.empty();
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return Optional.empty();
        }

        try {
            // 1. Créer l'utilisateur dans Firebase Authentication
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getPrenom() + " " + request.getNom())
                    .setEmailVerified(false);

            UserRecord userRecord = auth.createUser(createRequest);
            String firebaseUid = userRecord.getUid();
            
            log.info("Utilisateur créé dans Firebase Auth avec UID: {}", firebaseUid);

            // 2. Créer les données additionnelles dans Firestore (PAS de mot de passe!)
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", request.getEmail());
            userData.put("nom", request.getNom());
            userData.put("prenom", request.getPrenom());
            userData.put("telephone", request.getTelephone());
            userData.put("role", Role.UTILISATEUR.name());
            userData.put("isActive", true);
            userData.put("isLocked", false);
            userData.put("isOnline", false);
            userData.put("loginAttempts", 0);
            userData.put("createdAt", Timestamp.now());
            userData.put("updatedAt", Timestamp.now());

            // Utiliser le UID Firebase comme ID du document Firestore
            ApiFuture<WriteResult> future = firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .set(userData);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            
            log.info("Données utilisateur créées dans Firestore avec ID: {}", firebaseUid);
            return Optional.of(firebaseUid);

        } catch (FirebaseAuthException e) {
            if (e.getMessage().contains("EMAIL_EXISTS")) {
                log.info("Email déjà existant dans Firebase Auth: {}", request.getEmail());
            } else {
                log.error("Erreur Firebase Auth lors de la création: {}", e.getMessage());
            }
            return Optional.empty();
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur Firestore lors de la création: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    /**
     * Vérifie les credentials via Firebase Authentication.
     * Note: Firebase Admin SDK ne peut pas vérifier les mots de passe directement.
     * On doit utiliser Firebase Auth REST API ou le client SDK côté frontend.
     * 
     * Cette méthode vérifie si l'utilisateur existe et récupère ses données depuis Firestore.
     */
    public Optional<FirebaseUserData> getUserByEmail(String email) {
        if (!isOnline()) {
            log.info("Mode hors ligne - Authentification locale");
            return Optional.empty();
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return Optional.empty();
        }

        try {
            // Récupérer l'utilisateur depuis Firebase Auth
            UserRecord userRecord = auth.getUserByEmail(email);
            String firebaseUid = userRecord.getUid();
            
            // Récupérer les données additionnelles depuis Firestore
            DocumentSnapshot document = firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .get()
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (document.exists()) {
                FirebaseUserData userData = mapDocumentToUserData(document, firebaseUid);
                return Optional.of(userData);
            } else {
                // L'utilisateur existe dans Auth mais pas dans Firestore
                // Créer les données par défaut
                log.warn("Utilisateur existe dans Auth mais pas dans Firestore: {}", email);
                return Optional.of(createDefaultUserData(userRecord));
            }

        } catch (FirebaseAuthException e) {
            if (e.getMessage().contains("USER_NOT_FOUND")) {
                log.debug("Utilisateur non trouvé dans Firebase Auth: {}", email);
            } else {
                log.error("Erreur Firebase Auth: {}", e.getMessage());
            }
            return Optional.empty();
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur Firestore: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    /**
     * Met à jour le profil utilisateur dans Firebase.
     * 1. Met à jour Firebase Auth (email, password si changé)
     * 2. Met à jour Firestore (nom, prénom, téléphone, etc.)
     */
    public boolean updateUserInFirebase(String currentEmail, UpdateProfileRequest request) {
        if (!isOnline()) {
            log.info("Mode hors ligne - Mise à jour locale uniquement");
            return false;
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return false;
        }

        try {
            // Récupérer l'utilisateur depuis Firebase Auth
            UserRecord userRecord = auth.getUserByEmail(currentEmail);
            String firebaseUid = userRecord.getUid();

            // 1. Mettre à jour Firebase Auth si nécessaire
            UserRecord.UpdateRequest updateAuthRequest = new UserRecord.UpdateRequest(firebaseUid);
            boolean authUpdateNeeded = false;

            if (request.getEmail() != null && !request.getEmail().equals(currentEmail)) {
                updateAuthRequest.setEmail(request.getEmail());
                authUpdateNeeded = true;
            }
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                updateAuthRequest.setPassword(request.getPassword());
                authUpdateNeeded = true;
            }
            if (request.getNom() != null || request.getPrenom() != null) {
                String displayName = (request.getPrenom() != null ? request.getPrenom() : userRecord.getDisplayName().split(" ")[0]) 
                        + " " + (request.getNom() != null ? request.getNom() : "");
                updateAuthRequest.setDisplayName(displayName.trim());
                authUpdateNeeded = true;
            }

            if (authUpdateNeeded) {
                auth.updateUser(updateAuthRequest);
                log.info("Firebase Auth mis à jour pour: {}", currentEmail);
            }

            // 2. Mettre à jour Firestore (données additionnelles, PAS de mot de passe!)
            Map<String, Object> updates = new HashMap<>();
            
            if (request.getNom() != null) {
                updates.put("nom", request.getNom());
            }
            if (request.getPrenom() != null) {
                updates.put("prenom", request.getPrenom());
            }
            if (request.getTelephone() != null) {
                updates.put("telephone", request.getTelephone());
            }
            if (request.getEmail() != null && !request.getEmail().equals(currentEmail)) {
                updates.put("email", request.getEmail());
            }
            if (request.getRole() != null) {
                updates.put("role", request.getRole().name());
            }
            
            updates.put("updatedAt", Timestamp.now());

            ApiFuture<WriteResult> future = firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .update(updates);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            
            log.info("Firestore mis à jour pour: {}", currentEmail);
            return true;

        } catch (FirebaseAuthException e) {
            log.error("Erreur Firebase Auth lors de la mise à jour: {}", e.getMessage());
            return false;
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur Firestore lors de la mise à jour: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Vérifie si un email existe dans Firebase Auth.
     */
    public boolean emailExistsInFirebase(String email) {
        if (!isOnline()) {
            return false;
        }

        FirebaseAuth auth = getFirebaseAuth();
        if (auth == null) {
            return false;
        }

        try {
            auth.getUserByEmail(email);
            return true;
        } catch (FirebaseAuthException e) {
            return false;
        }
    }

    /**
     * Met à jour le statut de connexion dans Firestore.
     */
    public void updateOnlineStatus(String email, boolean isOnline) {
        if (!isOnline()) {
            return;
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return;
        }

        try {
            UserRecord userRecord = auth.getUserByEmail(email);
            String firebaseUid = userRecord.getUid();

            Map<String, Object> updates = new HashMap<>();
            updates.put("isOnline", isOnline);
            updates.put("updatedAt", Timestamp.now());
            
            if (isOnline) {
                updates.put("lastLogin", Timestamp.now());
                updates.put("loginAttempts", 0);
            }

            firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .update(updates);
            
            log.debug("Statut en ligne mis à jour pour {}: {}", email, isOnline);

        } catch (FirebaseAuthException e) {
            log.error("Erreur Firebase Auth: {}", e.getMessage());
        }
    }

    /**
     * Incrémente les tentatives de connexion dans Firestore.
     */
    public void incrementLoginAttempts(String email) {
        if (!isOnline()) {
            return;
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return;
        }

        try {
            UserRecord userRecord = auth.getUserByEmail(email);
            String firebaseUid = userRecord.getUid();

            DocumentSnapshot doc = firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .get()
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            Long currentAttempts = doc.getLong("loginAttempts");
            int attempts = (currentAttempts != null ? currentAttempts.intValue() : 0) + 1;

            Map<String, Object> updates = new HashMap<>();
            updates.put("loginAttempts", attempts);
            updates.put("updatedAt", Timestamp.now());

            // Verrouiller après 3 tentatives
            if (attempts >= 3) {
                updates.put("isLocked", true);
                updates.put("lockedAt", Timestamp.now());
            }

            firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .update(updates);

            log.debug("Tentatives de connexion incrémentées pour {}: {}", email, attempts);

        } catch (Exception e) {
            log.error("Erreur lors de l'incrémentation des tentatives: {}", e.getMessage());
        }
    }

    /**
     * Déverrouille un compte dans Firebase.
     */
    public boolean unlockAccountInFirebase(String email) {
        if (!isOnline()) {
            return false;
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return false;
        }

        try {
            UserRecord userRecord = auth.getUserByEmail(email);
            String firebaseUid = userRecord.getUid();

            Map<String, Object> updates = new HashMap<>();
            updates.put("isLocked", false);
            updates.put("loginAttempts", 0);
            updates.put("lockedAt", FieldValue.delete());
            updates.put("updatedAt", Timestamp.now());

            ApiFuture<WriteResult> future = firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .update(updates);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            
            log.info("Compte déverrouillé dans Firebase: {}", email);
            return true;

        } catch (FirebaseAuthException e) {
            log.error("Erreur Firebase Auth: {}", e.getMessage());
            return false;
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur Firestore: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Synchronise un utilisateur local vers Firebase.
     */
    public void syncUserToFirebase(User user) {
        if (!isOnline()) {
            return;
        }

        FirebaseAuth auth = getFirebaseAuth();
        Firestore firestore = getFirestore();
        
        if (auth == null || firestore == null) {
            return;
        }

        try {
            String firebaseUid;
            
            try {
                // Vérifier si l'utilisateur existe dans Firebase Auth
                UserRecord userRecord = auth.getUserByEmail(user.getEmail());
                firebaseUid = userRecord.getUid();
            } catch (FirebaseAuthException e) {
                // L'utilisateur n'existe pas dans Firebase Auth, on ne peut pas sync sans mot de passe
                log.debug("Utilisateur non présent dans Firebase Auth, sync impossible: {}", user.getEmail());
                return;
            }

            // Mettre à jour Firestore (PAS de mot de passe!)
            Map<String, Object> userData = new HashMap<>();
            userData.put("email", user.getEmail());
            userData.put("nom", user.getNom());
            userData.put("prenom", user.getPrenom());
            userData.put("telephone", user.getTelephone());
            userData.put("role", user.getRole().name());
            userData.put("isActive", user.getIsActive());
            userData.put("isLocked", user.getIsLocked());
            userData.put("isOnline", user.getIsOnline());
            userData.put("loginAttempts", user.getLoginAttempts());
            userData.put("updatedAt", Timestamp.now());

            if (user.getLastLogin() != null) {
                userData.put("lastLogin", Timestamp.of(java.util.Date.from(
                        user.getLastLogin().atZone(ZoneId.systemDefault()).toInstant())));
            }
            if (user.getLockedAt() != null) {
                userData.put("lockedAt", Timestamp.of(java.util.Date.from(
                        user.getLockedAt().atZone(ZoneId.systemDefault()).toInstant())));
            }

            firestore.collection(USERS_COLLECTION)
                    .document(firebaseUid)
                    .set(userData, SetOptions.merge());
            
            log.info("Utilisateur synchronisé vers Firebase: {}", user.getEmail());

        } catch (Exception e) {
            log.error("Erreur lors de la synchronisation vers Firebase: {}", e.getMessage());
        }
    }

    // === Méthodes privées ===

    private FirebaseUserData mapDocumentToUserData(DocumentSnapshot document, String firebaseUid) {
        FirebaseUserData userData = new FirebaseUserData();
        userData.setFirebaseId(firebaseUid);
        userData.setEmail(document.getString("email"));
        userData.setNom(document.getString("nom"));
        userData.setPrenom(document.getString("prenom"));
        userData.setTelephone(document.getString("telephone"));
        
        String roleStr = document.getString("role");
        userData.setRole(roleStr != null ? Role.valueOf(roleStr) : Role.VISITEUR);
        
        userData.setIsActive(document.getBoolean("isActive"));
        userData.setIsLocked(document.getBoolean("isLocked"));
        userData.setIsOnline(document.getBoolean("isOnline"));
        
        Long loginAttempts = document.getLong("loginAttempts");
        userData.setLoginAttempts(loginAttempts != null ? loginAttempts.intValue() : 0);
        
        Timestamp createdAt = document.getTimestamp("createdAt");
        if (createdAt != null) {
            userData.setCreatedAt(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(createdAt.getSeconds(), createdAt.getNanos()),
                    ZoneId.systemDefault()));
        }
        
        Timestamp lastLogin = document.getTimestamp("lastLogin");
        if (lastLogin != null) {
            userData.setLastLogin(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(lastLogin.getSeconds(), lastLogin.getNanos()),
                    ZoneId.systemDefault()));
        }
        
        Timestamp lockedAt = document.getTimestamp("lockedAt");
        if (lockedAt != null) {
            userData.setLockedAt(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(lockedAt.getSeconds(), lockedAt.getNanos()),
                    ZoneId.systemDefault()));
        }
        
        return userData;
    }

    private FirebaseUserData createDefaultUserData(UserRecord userRecord) {
        FirebaseUserData userData = new FirebaseUserData();
        userData.setFirebaseId(userRecord.getUid());
        userData.setEmail(userRecord.getEmail());
        userData.setRole(Role.VISITEUR);
        userData.setIsActive(true);
        userData.setIsLocked(false);
        userData.setIsOnline(false);
        userData.setLoginAttempts(0);
        
        // Parser le displayName si présent
        if (userRecord.getDisplayName() != null) {
            String[] parts = userRecord.getDisplayName().split(" ", 2);
            userData.setPrenom(parts[0]);
            if (parts.length > 1) {
                userData.setNom(parts[1]);
            }
        }
        
        return userData;
    }

    /**
     * Classe interne pour les données utilisateur Firebase.
     */
    @lombok.Data
    public static class FirebaseUserData {
        private String firebaseId;
        private String email;
        private String nom;
        private String prenom;
        private String telephone;
        private Role role;
        private Boolean isActive;
        private Boolean isLocked;
        private Boolean isOnline;
        private Integer loginAttempts;
        private LocalDateTime createdAt;
        private LocalDateTime lastLogin;
        private LocalDateTime lockedAt;
    }
}

