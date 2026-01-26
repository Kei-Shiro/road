package com.road.project.road_back.signalement.service;

import com.road.project.road_back.auth.entity.User;
import com.road.project.road_back.auth.repository.UserRepository;
import com.road.project.road_back.signalement.dto.*;
import com.road.project.road_back.signalement.entity.Signalement;
import com.road.project.road_back.signalement.entity.StatutSignalement;
import com.road.project.road_back.signalement.repository.SignalementRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de gestion des signalements.
 */
@Service
@RequiredArgsConstructor
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;

    /**
     * Récupère tous les signalements paginés.
     */
    public Page<SignalementResponse> getAllSignalements(Pageable pageable) {
        return signalementRepository.findByIsActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Récupère les signalements par statut.
     */
    public Page<SignalementResponse> getSignalementsByStatut(StatutSignalement statut, Pageable pageable) {
        return signalementRepository.findByStatutAndIsActiveTrue(statut, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Récupère un signalement par ID.
     */
    public SignalementResponse getSignalementById(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .filter(Signalement::getIsActive)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
        return mapToResponse(signalement);
    }

    /**
     * Récupère les signalements dans une zone géographique.
     */
    public List<SignalementResponse> getSignalementsByBounds(
            Double minLat, Double maxLat, Double minLng, Double maxLng) {
        return signalementRepository.findByBounds(minLat, maxLat, minLng, maxLng)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Crée un nouveau signalement.
     */
    @Transactional
    public SignalementResponse createSignalement(SignalementRequest request) {
        User currentUser = getCurrentUser();

        Signalement signalement = Signalement.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .adresse(request.getAdresse())
                .statut(request.getStatut() != null ? request.getStatut() : StatutSignalement.NOUVEAU)
                .surfaceImpactee(request.getSurfaceImpactee())
                .budget(request.getBudget())
                .entrepriseResponsable(request.getEntrepriseResponsable())
                .dateDebut(request.getDateDebut())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .pourcentageAvancement(request.getPourcentageAvancement() != null ? request.getPourcentageAvancement() : 0)
                .priorite(request.getPriorite())
                .type(request.getType())
                .photoUrl(request.getPhotoUrl())
                .syncId(request.getSyncId() != null ? request.getSyncId() : UUID.randomUUID().toString())
                .localUpdatedAt(request.getLocalUpdatedAt())
                .createdBy(currentUser)
                .build();

        signalement = signalementRepository.save(signalement);
        return mapToResponse(signalement);
    }

    /**
     * Met à jour un signalement.
     */
    @Transactional
    public SignalementResponse updateSignalement(Long id, SignalementRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .filter(Signalement::getIsActive)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        User currentUser = getCurrentUser();

        if (request.getTitre() != null) signalement.setTitre(request.getTitre());
        if (request.getDescription() != null) signalement.setDescription(request.getDescription());
        if (request.getLatitude() != null) signalement.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) signalement.setLongitude(request.getLongitude());
        if (request.getAdresse() != null) signalement.setAdresse(request.getAdresse());
        if (request.getStatut() != null) signalement.setStatut(request.getStatut());
        if (request.getSurfaceImpactee() != null) signalement.setSurfaceImpactee(request.getSurfaceImpactee());
        if (request.getBudget() != null) signalement.setBudget(request.getBudget());
        if (request.getEntrepriseResponsable() != null) signalement.setEntrepriseResponsable(request.getEntrepriseResponsable());
        if (request.getDateDebut() != null) signalement.setDateDebut(request.getDateDebut());
        if (request.getDateFinPrevue() != null) signalement.setDateFinPrevue(request.getDateFinPrevue());
        if (request.getDateFinReelle() != null) signalement.setDateFinReelle(request.getDateFinReelle());
        if (request.getPourcentageAvancement() != null) signalement.setPourcentageAvancement(request.getPourcentageAvancement());
        if (request.getPriorite() != null) signalement.setPriorite(request.getPriorite());
        if (request.getType() != null) signalement.setType(request.getType());
        if (request.getPhotoUrl() != null) signalement.setPhotoUrl(request.getPhotoUrl());
        if (request.getLocalUpdatedAt() != null) signalement.setLocalUpdatedAt(request.getLocalUpdatedAt());

        signalement.setUpdatedBy(currentUser);
        signalement = signalementRepository.save(signalement);
        return mapToResponse(signalement);
    }

    /**
     * Supprime un signalement (soft delete).
     */
    @Transactional
    public void deleteSignalement(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        signalement.setIsActive(false);
        signalementRepository.save(signalement);
    }

    /**
     * Récupère les statistiques des signalements.
     */
    public SignalementStatsResponse getStats() {
        Long total = signalementRepository.countActive();
        Long nouveaux = signalementRepository.countByStatut(StatutSignalement.NOUVEAU);
        Long enCours = signalementRepository.countByStatut(StatutSignalement.EN_COURS);
        Long termines = signalementRepository.countByStatut(StatutSignalement.TERMINE);
        Double surfaceTotale = signalementRepository.sumSurfaceImpactee();
        BigDecimal budgetTotal = signalementRepository.sumBudget();
        Double tauxAvancement = signalementRepository.avgPourcentageAvancement();

        // Comptage par statut
        Map<String, Long> parStatut = new HashMap<>();
        parStatut.put("NOUVEAU", nouveaux);
        parStatut.put("EN_COURS", enCours);
        parStatut.put("TERMINE", termines);

        // Comptage par entreprise
        List<SignalementStatsResponse.EntrepriseStats> parEntreprise =
            signalementRepository.countByEntreprise().stream()
                .map(row -> SignalementStatsResponse.EntrepriseStats.builder()
                        .nom((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        return SignalementStatsResponse.builder()
                .totalSignalements(total)
                .nouveaux(nouveaux)
                .enCours(enCours)
                .termines(termines)
                .surfaceTotale(surfaceTotale)
                .budgetTotal(budgetTotal)
                .tauxAvancementMoyen(tauxAvancement)
                .parStatut(parStatut)
                .parEntreprise(parEntreprise)
                .build();
    }

    /**
     * Synchronise les signalements depuis le client.
     */
    @Transactional
    public SyncResponse syncSignalements(SyncRequest request) {
        LocalDateTime syncTime = LocalDateTime.now();
        List<SignalementResponse> created = new ArrayList<>();
        List<SignalementResponse> updated = new ArrayList<>();
        List<String> deleted = new ArrayList<>();
        int conflictsResolved = 0;

        User currentUser = getCurrentUser();

        // Traiter les signalements envoyés par le client
        if (request.getSignalements() != null) {
            for (SignalementRequest sigRequest : request.getSignalements()) {
                if (sigRequest.getSyncId() != null) {
                    Optional<Signalement> existingOpt =
                        signalementRepository.findBySyncIdAndIsActiveTrue(sigRequest.getSyncId());

                    if (existingOpt.isPresent()) {
                        Signalement existing = existingOpt.get();

                        // Résolution de conflit: last-write-wins
                        if (sigRequest.getLocalUpdatedAt() != null &&
                            existing.getUpdatedAt() != null &&
                            sigRequest.getLocalUpdatedAt().isAfter(existing.getUpdatedAt())) {

                            updateFromRequest(existing, sigRequest, currentUser);
                            signalementRepository.save(existing);
                            updated.add(mapToResponse(existing));
                            conflictsResolved++;
                        } else {
                            updated.add(mapToResponse(existing));
                        }
                    } else {
                        // Nouveau signalement
                        Signalement signalement = createFromRequest(sigRequest, currentUser);
                        signalementRepository.save(signalement);
                        created.add(mapToResponse(signalement));
                    }
                }
            }
        }

        // Traiter les suppressions
        if (request.getDeletedSyncIds() != null) {
            for (String syncId : request.getDeletedSyncIds()) {
                signalementRepository.findBySyncIdAndIsActiveTrue(syncId)
                        .ifPresent(sig -> {
                            sig.setIsActive(false);
                            signalementRepository.save(sig);
                            deleted.add(syncId);
                        });
            }
        }

        // Récupérer les modifications côté serveur depuis la dernière sync
        List<SignalementResponse> serverChanges = new ArrayList<>();
        if (request.getLastSyncTime() != null) {
            serverChanges = signalementRepository.findModifiedSince(request.getLastSyncTime())
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return SyncResponse.builder()
                .syncTime(syncTime)
                .created(created)
                .updated(updated)
                .deleted(deleted)
                .serverChanges(serverChanges)
                .conflictsResolved(conflictsResolved)
                .build();
    }

    private void updateFromRequest(Signalement signalement, SignalementRequest request, User user) {
        if (request.getTitre() != null) signalement.setTitre(request.getTitre());
        if (request.getDescription() != null) signalement.setDescription(request.getDescription());
        if (request.getLatitude() != null) signalement.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) signalement.setLongitude(request.getLongitude());
        if (request.getAdresse() != null) signalement.setAdresse(request.getAdresse());
        if (request.getStatut() != null) signalement.setStatut(request.getStatut());
        if (request.getSurfaceImpactee() != null) signalement.setSurfaceImpactee(request.getSurfaceImpactee());
        if (request.getBudget() != null) signalement.setBudget(request.getBudget());
        if (request.getEntrepriseResponsable() != null) signalement.setEntrepriseResponsable(request.getEntrepriseResponsable());
        if (request.getDateDebut() != null) signalement.setDateDebut(request.getDateDebut());
        if (request.getDateFinPrevue() != null) signalement.setDateFinPrevue(request.getDateFinPrevue());
        if (request.getDateFinReelle() != null) signalement.setDateFinReelle(request.getDateFinReelle());
        if (request.getPourcentageAvancement() != null) signalement.setPourcentageAvancement(request.getPourcentageAvancement());
        if (request.getPriorite() != null) signalement.setPriorite(request.getPriorite());
        if (request.getType() != null) signalement.setType(request.getType());
        if (request.getPhotoUrl() != null) signalement.setPhotoUrl(request.getPhotoUrl());
        signalement.setLocalUpdatedAt(request.getLocalUpdatedAt());
        signalement.setUpdatedBy(user);
        signalement.setIsSynced(true);
    }

    private Signalement createFromRequest(SignalementRequest request, User user) {
        return Signalement.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .adresse(request.getAdresse())
                .statut(request.getStatut() != null ? request.getStatut() : StatutSignalement.NOUVEAU)
                .surfaceImpactee(request.getSurfaceImpactee())
                .budget(request.getBudget())
                .entrepriseResponsable(request.getEntrepriseResponsable())
                .dateDebut(request.getDateDebut())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .pourcentageAvancement(request.getPourcentageAvancement() != null ? request.getPourcentageAvancement() : 0)
                .priorite(request.getPriorite())
                .type(request.getType())
                .photoUrl(request.getPhotoUrl())
                .syncId(request.getSyncId())
                .localUpdatedAt(request.getLocalUpdatedAt())
                .createdBy(user)
                .isSynced(true)
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private SignalementResponse mapToResponse(Signalement signalement) {
        SignalementResponse.UserSummary createdByDto = null;
        if (signalement.getCreatedBy() != null) {
            createdByDto = SignalementResponse.UserSummary.builder()
                    .id(signalement.getCreatedBy().getId())
                    .nom(signalement.getCreatedBy().getNom())
                    .prenom(signalement.getCreatedBy().getPrenom())
                    .email(signalement.getCreatedBy().getEmail())
                    .build();
        }

        return SignalementResponse.builder()
                .id(signalement.getId())
                .titre(signalement.getTitre())
                .description(signalement.getDescription())
                .latitude(signalement.getLatitude())
                .longitude(signalement.getLongitude())
                .adresse(signalement.getAdresse())
                .statut(signalement.getStatut())
                .surfaceImpactee(signalement.getSurfaceImpactee())
                .budget(signalement.getBudget())
                .entrepriseResponsable(signalement.getEntrepriseResponsable())
                .dateDebut(signalement.getDateDebut())
                .dateFinPrevue(signalement.getDateFinPrevue())
                .dateFinReelle(signalement.getDateFinReelle())
                .pourcentageAvancement(signalement.getPourcentageAvancement())
                .priorite(signalement.getPriorite())
                .type(signalement.getType())
                .photoUrl(signalement.getPhotoUrl())
                .syncId(signalement.getSyncId())
                .isSynced(signalement.getIsSynced())
                .localUpdatedAt(signalement.getLocalUpdatedAt())
                .createdAt(signalement.getCreatedAt())
                .updatedAt(signalement.getUpdatedAt())
                .createdBy(createdByDto)
                .build();
    }
}

