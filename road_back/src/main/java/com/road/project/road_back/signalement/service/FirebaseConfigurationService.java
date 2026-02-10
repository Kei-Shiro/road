package com.road.project.road_back.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.road.project.road_back.config.FirebaseConfig;
import com.road.project.road_back.signalement.entity.Configuration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Service pour gérer les configurations dans Firebase Firestore.
 *
 * Collection Firestore: configurations
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseConfigurationService {

    private final FirebaseConfig firebaseConfig;

    private static final String CONFIGURATIONS_COLLECTION = "configurations";
    private static final int TIMEOUT_SECONDS = 10;

    /**
     * Vérifie si une connexion Internet est disponible.
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
     * Récupère le Firestore.
     */
    private Firestore getFirestore() {
        try {
            return com.google.firebase.cloud.FirestoreClient.getFirestore();
        } catch (Exception e) {
            log.warn("Firestore non disponible: {}", e.getMessage());
            return null;
        }
    }

    // ==================== CREATE / UPDATE ====================

    /**
     * Crée ou met à jour une configuration dans Firebase.
     */
    public boolean saveConfiguration(Configuration config) {
        if (!isOnline()) {
            log.info("Mode hors ligne - Configuration non sauvegardée dans Firebase");
            return false;
        }

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("cle", config.getCle());
            data.put("valeur", config.getValeur());
            data.put("description", config.getDescription());
            data.put("updatedAt", Timestamp.now());

            // Utiliser la clé comme ID du document
            ApiFuture<WriteResult> future = firestore.collection(CONFIGURATIONS_COLLECTION)
                    .document(config.getCle())
                    .set(data, SetOptions.merge());
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Configuration sauvegardée dans Firebase: {}", config.getCle());
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la sauvegarde de la configuration: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    // ==================== READ ====================

    /**
     * Récupère une configuration par sa clé depuis Firebase.
     */
    public Optional<FirebaseConfigurationData> getConfigurationByCle(String cle) {
        if (!isOnline() || cle == null) return Optional.empty();

        Firestore firestore = getFirestore();
        if (firestore == null) return Optional.empty();

        try {
            DocumentSnapshot doc = firestore.collection(CONFIGURATIONS_COLLECTION)
                    .document(cle)
                    .get()
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (doc.exists()) {
                return Optional.of(mapDocumentToConfigurationData(doc));
            }
            return Optional.empty();

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération de la configuration: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    /**
     * Récupère toutes les configurations depuis Firebase.
     */
    public List<FirebaseConfigurationData> getAllConfigurations() {
        if (!isOnline()) return Collections.emptyList();

        Firestore firestore = getFirestore();
        if (firestore == null) return Collections.emptyList();

        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(CONFIGURATIONS_COLLECTION).get();
            QuerySnapshot querySnapshot = future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            List<FirebaseConfigurationData> result = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                result.add(mapDocumentToConfigurationData(doc));
            }

            log.info("Récupéré {} configurations depuis Firebase", result.size());
            return result;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération des configurations: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }
    }

    // ==================== DELETE ====================

    /**
     * Supprime une configuration dans Firebase.
     */
    public boolean deleteConfiguration(String cle) {
        if (!isOnline() || cle == null) return false;

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            ApiFuture<WriteResult> future = firestore.collection(CONFIGURATIONS_COLLECTION)
                    .document(cle)
                    .delete();
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Configuration supprimée dans Firebase: {}", cle);
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la suppression de la configuration: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    // ==================== SYNC ====================

    /**
     * Synchronise une configuration locale vers Firebase.
     */
    public void syncToFirebase(Configuration config) {
        if (!isOnline()) return;
        saveConfiguration(config);
    }

    // ==================== MAPPING ====================

    private FirebaseConfigurationData mapDocumentToConfigurationData(DocumentSnapshot doc) {
        FirebaseConfigurationData data = new FirebaseConfigurationData();
        data.setCle(doc.getString("cle"));
        data.setValeur(doc.getString("valeur"));
        data.setDescription(doc.getString("description"));

        Timestamp updatedAt = doc.getTimestamp("updatedAt");
        if (updatedAt != null) {
            data.setUpdatedAt(LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(updatedAt.getSeconds(), updatedAt.getNanos()),
                    ZoneId.systemDefault()));
        }

        return data;
    }

    /**
     * DTO pour les données configuration Firebase.
     */
    @lombok.Data
    public static class FirebaseConfigurationData {
        private String cle;
        private String valeur;
        private String description;
        private LocalDateTime updatedAt;
    }
}

