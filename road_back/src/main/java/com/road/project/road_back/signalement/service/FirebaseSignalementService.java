package com.road.project.road_back.signalement.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.auth.FirebaseAuth;
import com.road.project.road_back.config.FirebaseConfig;
import com.road.project.road_back.signalement.entity.Signalement;
import com.road.project.road_back.signalement.entity.StatutSignalement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Service pour gérer les signalements dans Firebase Firestore.
 *
 * Collection Firestore: signalements
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseSignalementService {

    private final FirebaseConfig firebaseConfig;

    private static final String SIGNALEMENTS_COLLECTION = "signalements";
    private static final int TIMEOUT_SECONDS = 15;

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

    // ==================== CREATE ====================

    /**
     * Crée un signalement dans Firebase.
     */
    public Optional<String> createSignalement(Signalement signalement) {
        if (!isOnline()) {
            log.info("Mode hors ligne - Signalement non créé dans Firebase");
            return Optional.empty();
        }

        Firestore firestore = getFirestore();
        if (firestore == null) return Optional.empty();

        try {
            Map<String, Object> data = mapSignalementToFirestore(signalement);
            data.put("createdAt", Timestamp.now());

            String docId = signalement.getSyncId() != null ? signalement.getSyncId() : UUID.randomUUID().toString();

            ApiFuture<WriteResult> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(docId)
                    .set(data);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Signalement créé dans Firebase avec ID: {}", docId);
            return Optional.of(docId);

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la création du signalement dans Firebase: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    // ==================== READ ====================

    /**
     * Récupère tous les signalements actifs depuis Firebase.
     */
    public List<FirebaseSignalementData> getAllSignalements() {
        if (!isOnline()) return Collections.emptyList();

        Firestore firestore = getFirestore();
        if (firestore == null) return Collections.emptyList();

        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .whereEqualTo("isActive", true)
                    .get();

            QuerySnapshot querySnapshot = future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            List<FirebaseSignalementData> result = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                result.add(mapDocumentToSignalementData(doc));
            }

            log.info("Récupéré {} signalements depuis Firebase", result.size());
            return result;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération des signalements: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }
    }

    /**
     * Récupère un signalement par son syncId depuis Firebase.
     */
    public Optional<FirebaseSignalementData> getSignalementBySyncId(String syncId) {
        if (!isOnline() || syncId == null) return Optional.empty();

        Firestore firestore = getFirestore();
        if (firestore == null) return Optional.empty();

        try {
            DocumentSnapshot doc = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(syncId)
                    .get()
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (doc.exists()) {
                return Optional.of(mapDocumentToSignalementData(doc));
            }
            return Optional.empty();

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération du signalement: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    /**
     * Récupère les signalements par statut.
     */
    public List<FirebaseSignalementData> getSignalementsByStatut(StatutSignalement statut) {
        if (!isOnline()) return Collections.emptyList();

        Firestore firestore = getFirestore();
        if (firestore == null) return Collections.emptyList();

        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .whereEqualTo("statut", statut.name())
                    .whereEqualTo("isActive", true)
                    .get();

            QuerySnapshot querySnapshot = future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            List<FirebaseSignalementData> result = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                result.add(mapDocumentToSignalementData(doc));
            }
            return result;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération par statut: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }
    }

    /**
     * Récupère les signalements dans une zone géographique.
     */
    public List<FirebaseSignalementData> getSignalementsByBounds(
            Double minLat, Double maxLat, Double minLng, Double maxLng) {
        if (!isOnline()) return Collections.emptyList();

        Firestore firestore = getFirestore();
        if (firestore == null) return Collections.emptyList();

        try {
            // Firestore ne supporte pas les requêtes sur plusieurs champs avec inégalités
            // On filtre côté client
            ApiFuture<QuerySnapshot> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .whereEqualTo("isActive", true)
                    .get();

            QuerySnapshot querySnapshot = future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            List<FirebaseSignalementData> result = new ArrayList<>();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Double lat = doc.getDouble("latitude");
                Double lng = doc.getDouble("longitude");

                if (lat != null && lng != null &&
                    lat >= minLat && lat <= maxLat &&
                    lng >= minLng && lng <= maxLng) {
                    result.add(mapDocumentToSignalementData(doc));
                }
            }
            return result;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la récupération par bounds: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }
    }

    // ==================== UPDATE ====================

    /**
     * Met à jour un signalement dans Firebase.
     */
    public boolean updateSignalement(String syncId, Signalement signalement) {
        if (!isOnline() || syncId == null) {
            log.info("Mode hors ligne - Mise à jour non effectuée dans Firebase");
            return false;
        }

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            Map<String, Object> data = mapSignalementToFirestore(signalement);
            data.put("updatedAt", Timestamp.now());

            ApiFuture<WriteResult> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(syncId)
                    .set(data, SetOptions.merge());
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Signalement mis à jour dans Firebase: {}", syncId);
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la mise à jour du signalement: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Met à jour le statut d'un signalement dans Firebase.
     */
    public boolean updateStatut(String syncId, StatutSignalement statut, Integer pourcentage) {
        if (!isOnline() || syncId == null) return false;

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("statut", statut.name());
            updates.put("pourcentageAvancement", pourcentage);
            updates.put("updatedAt", Timestamp.now());

            // Mettre à jour les dates selon le statut
            LocalDateTime now = LocalDateTime.now();
            switch (statut) {
                case NOUVEAU:
                    updates.put("dateNouveau", toTimestamp(now));
                    break;
                case EN_COURS:
                    updates.put("dateEnCours", toTimestamp(now));
                    break;
                case TERMINE:
                    updates.put("dateTermine", toTimestamp(now));
                    break;
            }

            ApiFuture<WriteResult> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(syncId)
                    .update(updates);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Statut mis à jour dans Firebase: {} -> {}", syncId, statut);
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la mise à jour du statut: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    // ==================== DELETE ====================

    /**
     * Supprime (soft delete) un signalement dans Firebase.
     */
    public boolean deleteSignalement(String syncId) {
        if (!isOnline() || syncId == null) return false;

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("isActive", false);
            updates.put("updatedAt", Timestamp.now());

            ApiFuture<WriteResult> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(syncId)
                    .update(updates);
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Signalement supprimé (soft delete) dans Firebase: {}", syncId);
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la suppression du signalement: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    /**
     * Supprime définitivement un signalement dans Firebase (hard delete).
     */
    public boolean hardDeleteSignalement(String syncId) {
        if (!isOnline() || syncId == null) return false;

        Firestore firestore = getFirestore();
        if (firestore == null) return false;

        try {
            ApiFuture<WriteResult> future = firestore.collection(SIGNALEMENTS_COLLECTION)
                    .document(syncId)
                    .delete();
            future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            log.info("Signalement supprimé définitivement dans Firebase: {}", syncId);
            return true;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("Erreur lors de la suppression définitive: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        }
    }

    // ==================== SYNC ====================

    /**
     * Synchronise un signalement local vers Firebase.
     */
    public void syncToFirebase(Signalement signalement) {
        if (!isOnline()) return;

        String syncId = signalement.getSyncId();
        if (syncId == null) {
            syncId = UUID.randomUUID().toString();
        }

        if (getSignalementBySyncId(syncId).isPresent()) {
            updateSignalement(syncId, signalement);
        } else {
            createSignalement(signalement);
        }
    }

    // ==================== MAPPING ====================

    private Map<String, Object> mapSignalementToFirestore(Signalement s) {
        Map<String, Object> data = new HashMap<>();

        data.put("titre", s.getTitre());
        data.put("description", s.getDescription());
        data.put("latitude", s.getLatitude());
        data.put("longitude", s.getLongitude());
        data.put("adresse", s.getAdresse());
        data.put("statut", s.getStatut() != null ? s.getStatut().name() : StatutSignalement.NOUVEAU.name());
        data.put("surfaceImpactee", s.getSurfaceImpactee());
        data.put("niveau", s.getNiveau());
        data.put("budget", s.getBudget() != null ? s.getBudget().doubleValue() : null);
        data.put("entrepriseResponsable", s.getEntrepriseResponsable());
        data.put("pourcentageAvancement", s.getPourcentageAvancement());
        data.put("priorite", s.getPriorite());
        data.put("type", s.getType());
        data.put("photoUrl", s.getPhotoUrl());
        data.put("syncId", s.getSyncId());
        data.put("isActive", s.getIsActive() != null ? s.getIsActive() : true);
        data.put("isSynced", true);

        // Dates
        if (s.getDateDebut() != null) data.put("dateDebut", s.getDateDebut().toString());
        if (s.getDateFinPrevue() != null) data.put("dateFinPrevue", s.getDateFinPrevue().toString());
        if (s.getDateFinReelle() != null) data.put("dateFinReelle", s.getDateFinReelle().toString());
        if (s.getDateNouveau() != null) data.put("dateNouveau", toTimestamp(s.getDateNouveau()));
        if (s.getDateEnCours() != null) data.put("dateEnCours", toTimestamp(s.getDateEnCours()));
        if (s.getDateTermine() != null) data.put("dateTermine", toTimestamp(s.getDateTermine()));

        // Créateur
        if (s.getCreatedBy() != null) {
            data.put("createdByEmail", s.getCreatedBy().getEmail());
            data.put("createdById", s.getCreatedBy().getId());
        }
        if (s.getUpdatedBy() != null) {
            data.put("updatedByEmail", s.getUpdatedBy().getEmail());
            data.put("updatedById", s.getUpdatedBy().getId());
        }

        data.put("updatedAt", Timestamp.now());

        return data;
    }

    private FirebaseSignalementData mapDocumentToSignalementData(DocumentSnapshot doc) {
        FirebaseSignalementData data = new FirebaseSignalementData();

        data.setFirebaseId(doc.getId());
        data.setSyncId(doc.getString("syncId"));
        data.setTitre(doc.getString("titre"));
        data.setDescription(doc.getString("description"));
        data.setLatitude(doc.getDouble("latitude"));
        data.setLongitude(doc.getDouble("longitude"));
        data.setAdresse(doc.getString("adresse"));

        String statutStr = doc.getString("statut");
        data.setStatut(statutStr != null ? StatutSignalement.valueOf(statutStr) : StatutSignalement.NOUVEAU);

        data.setSurfaceImpactee(doc.getDouble("surfaceImpactee"));

        Long niveau = doc.getLong("niveau");
        data.setNiveau(niveau != null ? niveau.intValue() : 1);

        Double budget = doc.getDouble("budget");
        data.setBudget(budget != null ? BigDecimal.valueOf(budget) : null);

        data.setEntrepriseResponsable(doc.getString("entrepriseResponsable"));

        Long pourcentage = doc.getLong("pourcentageAvancement");
        data.setPourcentageAvancement(pourcentage != null ? pourcentage.intValue() : 0);

        data.setPriorite(doc.getString("priorite"));
        data.setType(doc.getString("type"));
        data.setPhotoUrl(doc.getString("photoUrl"));
        data.setIsActive(doc.getBoolean("isActive"));
        data.setIsSynced(doc.getBoolean("isSynced"));

        // Dates
        String dateDebutStr = doc.getString("dateDebut");
        if (dateDebutStr != null) data.setDateDebut(LocalDate.parse(dateDebutStr));

        String dateFinPrevueStr = doc.getString("dateFinPrevue");
        if (dateFinPrevueStr != null) data.setDateFinPrevue(LocalDate.parse(dateFinPrevueStr));

        String dateFinReelleStr = doc.getString("dateFinReelle");
        if (dateFinReelleStr != null) data.setDateFinReelle(LocalDate.parse(dateFinReelleStr));

        data.setDateNouveau(fromTimestamp(doc.getTimestamp("dateNouveau")));
        data.setDateEnCours(fromTimestamp(doc.getTimestamp("dateEnCours")));
        data.setDateTermine(fromTimestamp(doc.getTimestamp("dateTermine")));
        data.setCreatedAt(fromTimestamp(doc.getTimestamp("createdAt")));
        data.setUpdatedAt(fromTimestamp(doc.getTimestamp("updatedAt")));

        data.setCreatedByEmail(doc.getString("createdByEmail"));
        data.setUpdatedByEmail(doc.getString("updatedByEmail"));

        return data;
    }

    private Timestamp toTimestamp(LocalDateTime ldt) {
        if (ldt == null) return null;
        return Timestamp.of(java.util.Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant()));
    }

    private LocalDateTime fromTimestamp(Timestamp ts) {
        if (ts == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos()), ZoneId.systemDefault());
    }

    /**
     * DTO pour les données signalement Firebase.
     */
    @lombok.Data
    public static class FirebaseSignalementData {
        private String firebaseId;
        private String syncId;
        private String titre;
        private String description;
        private Double latitude;
        private Double longitude;
        private String adresse;
        private StatutSignalement statut;
        private Double surfaceImpactee;
        private Integer niveau;
        private BigDecimal budget;
        private String entrepriseResponsable;
        private LocalDate dateDebut;
        private LocalDate dateFinPrevue;
        private LocalDate dateFinReelle;
        private LocalDateTime dateNouveau;
        private LocalDateTime dateEnCours;
        private LocalDateTime dateTermine;
        private Integer pourcentageAvancement;
        private String priorite;
        private String type;
        private String photoUrl;
        private Boolean isActive;
        private Boolean isSynced;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String createdByEmail;
        private String updatedByEmail;
    }
}

