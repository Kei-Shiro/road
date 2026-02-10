package com.road.project.road_back.signalement.service;

import com.road.project.road_back.auth.entity.User;
import com.road.project.road_back.auth.repository.UserRepository;
import com.road.project.road_back.signalement.dto.*;
import com.road.project.road_back.signalement.entity.Configuration;
import com.road.project.road_back.signalement.entity.Signalement;
import com.road.project.road_back.signalement.entity.StatutSignalement;
import com.road.project.road_back.signalement.repository.ConfigurationRepository;
import com.road.project.road_back.signalement.repository.SignalementRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de gestion des signalements.
 * Utilise Firebase Firestore si connexion disponible, sinon base locale.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;
    private final ConfigurationRepository configurationRepository;
    private final FirebaseSignalementService firebaseSignalementService;
    private final FirebaseConfigurationService firebaseConfigurationService;

    /**
     * Récupère tous les signalements paginés.
     * Priorité: Firebase si online, sinon local.
     */
    public Page<SignalementResponse> getAllSignalements(Pageable pageable) {
        // Essayer Firebase d'abord
        if (firebaseSignalementService.isOnline()) {
            log.info("Récupération des signalements depuis Firebase");
            List<FirebaseSignalementService.FirebaseSignalementData> firebaseData =
                    firebaseSignalementService.getAllSignalements();

            if (!firebaseData.isEmpty()) {
                List<SignalementResponse> responses = firebaseData.stream()
                        .map(this::mapFirebaseToResponse)
                        .collect(Collectors.toList());

                // Pagination manuelle
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), responses.size());

                if (start > responses.size()) {
                    return new PageImpl<>(Collections.emptyList(), pageable, responses.size());
                }

                return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
            }
        }

        // Fallback local
        log.info("Récupération des signalements depuis la base locale");
        return signalementRepository.findByIsActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Récupère les signalements par statut.
     */
    public Page<SignalementResponse> getSignalementsByStatut(StatutSignalement statut, Pageable pageable) {
        // Essayer Firebase d'abord
        if (firebaseSignalementService.isOnline()) {
            List<FirebaseSignalementService.FirebaseSignalementData> firebaseData =
                    firebaseSignalementService.getSignalementsByStatut(statut);

            if (!firebaseData.isEmpty()) {
                List<SignalementResponse> responses = firebaseData.stream()
                        .map(this::mapFirebaseToResponse)
                        .collect(Collectors.toList());

                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), responses.size());

                if (start > responses.size()) {
                    return new PageImpl<>(Collections.emptyList(), pageable, responses.size());
                }

                return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
            }
        }

        // Fallback local
        return signalementRepository.findByStatutAndIsActiveTrue(statut, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Récupère un signalement par ID.
     * Cherche d'abord localement, puis vérifie dans Firebase si nécessaire.
     */
    public SignalementResponse getSignalementById(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .filter(Signalement::getIsActive)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        // Si online et syncId existe, récupérer les données à jour depuis Firebase
        if (firebaseSignalementService.isOnline() && signalement.getSyncId() != null) {
            Optional<FirebaseSignalementService.FirebaseSignalementData> firebaseData =
                    firebaseSignalementService.getSignalementBySyncId(signalement.getSyncId());

            if (firebaseData.isPresent()) {
                // Synchroniser les données Firebase vers local
                syncFirebaseToLocal(signalement, firebaseData.get());
                signalementRepository.save(signalement);
            }
        }

        return mapToResponse(signalement);
    }

    /**
     * Récupère les signalements dans une zone géographique.
     */
    public List<SignalementResponse> getSignalementsByBounds(
            Double minLat, Double maxLat, Double minLng, Double maxLng) {

        // Essayer Firebase d'abord
        if (firebaseSignalementService.isOnline()) {
            List<FirebaseSignalementService.FirebaseSignalementData> firebaseData =
                    firebaseSignalementService.getSignalementsByBounds(minLat, maxLat, minLng, maxLng);

            if (!firebaseData.isEmpty()) {
                return firebaseData.stream()
                        .map(this::mapFirebaseToResponse)
                        .collect(Collectors.toList());
            }
        }

        // Fallback local
        return signalementRepository.findByBounds(minLat, maxLat, minLng, maxLng)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Crée un nouveau signalement.
     * Crée dans Firebase si online, puis localement.
     */
    @Transactional
    public SignalementResponse createSignalement(SignalementRequest request) {
        User currentUser = getCurrentUser();

        StatutSignalement statut = request.getStatut() != null ? request.getStatut() : StatutSignalement.NOUVEAU;
        Integer pourcentage = calculerPourcentageParStatut(statut);
        LocalDateTime now = LocalDateTime.now();

        // Niveau par défaut à 1 si non spécifié
        Integer niveau = request.getNiveau() != null ? request.getNiveau() : 1;
        // S'assurer que le niveau est entre 1 et 10
        niveau = Math.max(1, Math.min(10, niveau));

        // Calcul automatique du budget: prix_par_m2 * niveau * surface_m2
        BigDecimal budget = calculerBudget(request.getSurfaceImpactee(), niveau);

        // Générer syncId si non fourni
        String syncId = request.getSyncId() != null ? request.getSyncId() : UUID.randomUUID().toString();

        Signalement signalement = Signalement.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .adresse(request.getAdresse())
                .statut(statut)
                .surfaceImpactee(request.getSurfaceImpactee())
                .niveau(niveau)
                .budget(budget)
                .entrepriseResponsable(request.getEntrepriseResponsable())
                .dateDebut(request.getDateDebut())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .pourcentageAvancement(pourcentage)
                .dateNouveau(statut == StatutSignalement.NOUVEAU ? now : null)
                .dateEnCours(statut == StatutSignalement.EN_COURS ? now : null)
                .dateTermine(statut == StatutSignalement.TERMINE ? now : null)
                .priorite(request.getPriorite())
                .type(request.getType())
                .photoUrl(request.getPhotoUrl())
                .syncId(syncId)
                .localUpdatedAt(request.getLocalUpdatedAt())
                .createdBy(currentUser)
                .build();

        // Sauvegarder localement
        signalement = signalementRepository.save(signalement);

        // Créer dans Firebase si online
        if (firebaseSignalementService.isOnline()) {
            log.info("Création du signalement dans Firebase: {}", syncId);
            firebaseSignalementService.createSignalement(signalement);
            signalement.setIsSynced(true);
            signalementRepository.save(signalement);
        } else {
            signalement.setIsSynced(false);
            signalementRepository.save(signalement);
        }

        return mapToResponse(signalement);
    }

    /**
     * Met à jour un signalement.
     * Met à jour dans Firebase si online, puis localement.
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

        // Gestion du changement de statut avec mise à jour des dates et du pourcentage
        if (request.getStatut() != null && request.getStatut() != signalement.getStatut()) {
            updateStatutWithDates(signalement, request.getStatut());
        }

        // Gestion du niveau (entre 1 et 10)
        boolean needRecalculateBudget = false;
        if (request.getNiveau() != null) {
            Integer niveau = Math.max(1, Math.min(10, request.getNiveau()));
            signalement.setNiveau(niveau);
            needRecalculateBudget = true;
        }

        if (request.getSurfaceImpactee() != null) {
            signalement.setSurfaceImpactee(request.getSurfaceImpactee());
            needRecalculateBudget = true;
        }

        // Recalcul automatique du budget si niveau ou surface ont changé
        if (needRecalculateBudget) {
            BigDecimal budget = calculerBudget(signalement.getSurfaceImpactee(), signalement.getNiveau());
            signalement.setBudget(budget);
        }

        if (request.getEntrepriseResponsable() != null) signalement.setEntrepriseResponsable(request.getEntrepriseResponsable());
        if (request.getDateDebut() != null) signalement.setDateDebut(request.getDateDebut());
        if (request.getDateFinPrevue() != null) signalement.setDateFinPrevue(request.getDateFinPrevue());
        if (request.getDateFinReelle() != null) signalement.setDateFinReelle(request.getDateFinReelle());
        if (request.getPriorite() != null) signalement.setPriorite(request.getPriorite());
        if (request.getType() != null) signalement.setType(request.getType());
        if (request.getPhotoUrl() != null) signalement.setPhotoUrl(request.getPhotoUrl());
        if (request.getLocalUpdatedAt() != null) signalement.setLocalUpdatedAt(request.getLocalUpdatedAt());

        signalement.setUpdatedBy(currentUser);
        signalement = signalementRepository.save(signalement);

        // Mettre à jour dans Firebase si online
        if (firebaseSignalementService.isOnline() && signalement.getSyncId() != null) {
            log.info("Mise à jour du signalement dans Firebase: {}", signalement.getSyncId());
            boolean updated = firebaseSignalementService.updateSignalement(signalement.getSyncId(), signalement);
            signalement.setIsSynced(updated);
            signalementRepository.save(signalement);
        } else {
            signalement.setIsSynced(false);
            signalementRepository.save(signalement);
        }

        return mapToResponse(signalement);
    }

    /**
     * Met à jour le statut avec les dates et le pourcentage d'avancement associés.
     */
    private void updateStatutWithDates(Signalement signalement, StatutSignalement nouveauStatut) {
        LocalDateTime now = LocalDateTime.now();

        signalement.setStatut(nouveauStatut);
        signalement.setPourcentageAvancement(calculerPourcentageParStatut(nouveauStatut));

        switch (nouveauStatut) {
            case NOUVEAU:
                if (signalement.getDateNouveau() == null) {
                    signalement.setDateNouveau(now);
                }
                break;
            case EN_COURS:
                if (signalement.getDateNouveau() == null) {
                    signalement.setDateNouveau(signalement.getCreatedAt());
                }
                if (signalement.getDateEnCours() == null) {
                    signalement.setDateEnCours(now);
                }
                break;
            case TERMINE:
                if (signalement.getDateNouveau() == null) {
                    signalement.setDateNouveau(signalement.getCreatedAt());
                }
                if (signalement.getDateEnCours() == null) {
                    signalement.setDateEnCours(now);
                }
                signalement.setDateTermine(now);
                break;
            default:
                break;
        }
    }

    /**
     * Calcule le pourcentage d'avancement basé sur le statut.
     * NOUVEAU = 0%, EN_COURS = 50%, TERMINE = 100%
     */
    private Integer calculerPourcentageParStatut(StatutSignalement statut) {
        switch (statut) {
            case NOUVEAU:
                return 0;
            case EN_COURS:
                return 50;
            case TERMINE:
                return 100;
            default:
                return 0;
        }
    }

    /**
     * Supprime un signalement (soft delete).
     * Supprime dans Firebase si online, puis localement.
     */
    @Transactional
    public void deleteSignalement(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));

        signalement.setIsActive(false);
        signalementRepository.save(signalement);

        // Supprimer dans Firebase si online
        if (firebaseSignalementService.isOnline() && signalement.getSyncId() != null) {
            log.info("Suppression du signalement dans Firebase: {}", signalement.getSyncId());
            firebaseSignalementService.deleteSignalement(signalement.getSyncId());
        }
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

        // Calcul des statistiques de traitement
        SignalementStatsResponse.TraitementStats traitement = calculerTraitementStats();

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
                .traitement(traitement)
                .build();
    }

    /**
     * Calcule les statistiques de temps de traitement moyen.
     */
    private SignalementStatsResponse.TraitementStats calculerTraitementStats() {
        // Temps moyen de NOUVEAU à EN_COURS
        List<Signalement> nouveauToEnCours = signalementRepository.findWithNouveauToEnCoursDates();
        Double tempsNouveauAEnCours = calculerTempsMoyenEnHeures(
            nouveauToEnCours,
            Signalement::getDateNouveau,
            Signalement::getDateEnCours
        );

        // Temps moyen de EN_COURS à TERMINE
        List<Signalement> enCoursToTermine = signalementRepository.findWithEnCoursToTermineDates();
        Double tempsEnCoursATermine = calculerTempsMoyenEnHeures(
            enCoursToTermine,
            Signalement::getDateEnCours,
            Signalement::getDateTermine
        );

        // Temps moyen total de NOUVEAU à TERMINE
        List<Signalement> nouveauToTermine = signalementRepository.findWithNouveauToTermineDates();
        Double tempsTotal = calculerTempsMoyenEnHeures(
            nouveauToTermine,
            Signalement::getDateNouveau,
            Signalement::getDateTermine
        );

        return SignalementStatsResponse.TraitementStats.builder()
                .tempsNouveauAEnCours(tempsNouveauAEnCours)
                .tempsEnCoursATermine(tempsEnCoursATermine)
                .tempsTotal(tempsTotal)
                .nombreTravauxTermines((long) nouveauToTermine.size())
                .nombreTravauxEnCours((long) enCoursToTermine.size())
                .nombreNouveauxTraitements((long) nouveauToEnCours.size())
                .build();
    }

    /**
     * Calcule le temps moyen en heures entre deux dates.
     */
    private Double calculerTempsMoyenEnHeures(
            List<Signalement> signalements,
            java.util.function.Function<Signalement, LocalDateTime> getDateDebut,
            java.util.function.Function<Signalement, LocalDateTime> getDateFin) {

        if (signalements.isEmpty()) {
            return 0.0;
        }

        double totalHeures = signalements.stream()
            .filter(s -> getDateDebut.apply(s) != null && getDateFin.apply(s) != null)
            .mapToDouble(s -> {
                LocalDateTime debut = getDateDebut.apply(s);
                LocalDateTime fin = getDateFin.apply(s);
                return java.time.Duration.between(debut, fin).toHours();
            })
            .sum();

        long count = signalements.stream()
            .filter(s -> getDateDebut.apply(s) != null && getDateFin.apply(s) != null)
            .count();

        return count > 0 ? totalHeures / count : 0.0;
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

        // Gestion du changement de statut avec mise à jour des dates et du pourcentage
        if (request.getStatut() != null && request.getStatut() != signalement.getStatut()) {
            updateStatutWithDates(signalement, request.getStatut());
        }

        if (request.getSurfaceImpactee() != null) signalement.setSurfaceImpactee(request.getSurfaceImpactee());
        if (request.getBudget() != null) signalement.setBudget(request.getBudget());
        if (request.getEntrepriseResponsable() != null) signalement.setEntrepriseResponsable(request.getEntrepriseResponsable());
        if (request.getDateDebut() != null) signalement.setDateDebut(request.getDateDebut());
        if (request.getDateFinPrevue() != null) signalement.setDateFinPrevue(request.getDateFinPrevue());
        if (request.getDateFinReelle() != null) signalement.setDateFinReelle(request.getDateFinReelle());
        if (request.getPriorite() != null) signalement.setPriorite(request.getPriorite());
        if (request.getType() != null) signalement.setType(request.getType());
        if (request.getPhotoUrl() != null) signalement.setPhotoUrl(request.getPhotoUrl());
        signalement.setLocalUpdatedAt(request.getLocalUpdatedAt());
        signalement.setUpdatedBy(user);
        signalement.setIsSynced(true);
    }

    private Signalement createFromRequest(SignalementRequest request, User user) {
        StatutSignalement statut = request.getStatut() != null ? request.getStatut() : StatutSignalement.NOUVEAU;
        Integer pourcentage = calculerPourcentageParStatut(statut);
        LocalDateTime now = LocalDateTime.now();

        // Niveau par défaut à 1 si non spécifié
        Integer niveau = request.getNiveau() != null ? request.getNiveau() : 1;
        niveau = Math.max(1, Math.min(10, niveau));

        // Calcul automatique du budget
        BigDecimal budget = calculerBudget(request.getSurfaceImpactee(), niveau);

        return Signalement.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .adresse(request.getAdresse())
                .statut(statut)
                .surfaceImpactee(request.getSurfaceImpactee())
                .niveau(niveau)
                .budget(budget)
                .entrepriseResponsable(request.getEntrepriseResponsable())
                .dateDebut(request.getDateDebut())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .pourcentageAvancement(pourcentage)
                .dateNouveau(statut == StatutSignalement.NOUVEAU ? now : null)
                .dateEnCours(statut == StatutSignalement.EN_COURS ? now : null)
                .dateTermine(statut == StatutSignalement.TERMINE ? now : null)
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
                .niveau(signalement.getNiveau())
                .budget(signalement.getBudget())
                .entrepriseResponsable(signalement.getEntrepriseResponsable())
                .dateDebut(signalement.getDateDebut())
                .dateFinPrevue(signalement.getDateFinPrevue())
                .dateFinReelle(signalement.getDateFinReelle())
                .dateNouveau(signalement.getDateNouveau())
                .dateEnCours(signalement.getDateEnCours())
                .dateTermine(signalement.getDateTermine())
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

    /**
     * Calcule le budget automatiquement: prix_par_m2 * niveau * surface_m2
     */
    private BigDecimal calculerBudget(Double surfaceImpactee, Integer niveau) {
        if (surfaceImpactee == null || surfaceImpactee <= 0 || niveau == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal prixParM2 = getPrixParM2();
        BigDecimal surface = BigDecimal.valueOf(surfaceImpactee);
        BigDecimal niveauDecimal = BigDecimal.valueOf(niveau);

        return prixParM2.multiply(niveauDecimal).multiply(surface);
    }

    /**
     * Récupère le prix par m² forfaitaire depuis la configuration.
     */
    public BigDecimal getPrixParM2() {
        return configurationRepository.findByCle(Configuration.PRIX_PAR_M2)
                .map(config -> new BigDecimal(config.getValeur()))
                .orElse(Configuration.PRIX_PAR_M2_DEFAULT);
    }

    /**
     * Met à jour le prix par m² forfaitaire.
     */
    @Transactional
    public ConfigurationResponse setPrixParM2(BigDecimal prixParM2) {
        Configuration config = configurationRepository.findByCle(Configuration.PRIX_PAR_M2)
                .orElse(Configuration.builder()
                        .cle(Configuration.PRIX_PAR_M2)
                        .description("Prix forfaitaire par m² pour le calcul du budget des réparations")
                        .build());

        config.setValeur(prixParM2.toString());
        config = configurationRepository.save(config);

        return mapConfigToResponse(config);
    }

    /**
     * Récupère toutes les configurations.
     */
    public List<ConfigurationResponse> getAllConfigurations() {
        // Essayer Firebase d'abord
        if (firebaseConfigurationService.isOnline()) {
            List<FirebaseConfigurationService.FirebaseConfigurationData> firebaseData =
                    firebaseConfigurationService.getAllConfigurations();

            if (!firebaseData.isEmpty()) {
                return firebaseData.stream()
                        .map(this::mapFirebaseConfigToResponse)
                        .collect(Collectors.toList());
            }
        }

        // Fallback local
        return configurationRepository.findAll().stream()
                .map(this::mapConfigToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une configuration par sa clé.
     */
    public ConfigurationResponse getConfiguration(String cle) {
        // Essayer Firebase d'abord
        if (firebaseConfigurationService.isOnline()) {
            Optional<FirebaseConfigurationService.FirebaseConfigurationData> firebaseData =
                    firebaseConfigurationService.getConfigurationByCle(cle);

            if (firebaseData.isPresent()) {
                return mapFirebaseConfigToResponse(firebaseData.get());
            }
        }

        // Fallback local
        return configurationRepository.findByCle(cle)
                .map(this::mapConfigToResponse)
                .orElse(null);
    }

    /**
     * Met à jour une configuration.
     * Met à jour dans Firebase si online, puis localement.
     */
    @Transactional
    public ConfigurationResponse updateConfiguration(ConfigurationRequest request) {
        Configuration config = configurationRepository.findByCle(request.getCle())
                .orElse(Configuration.builder()
                        .cle(request.getCle())
                        .build());

        config.setValeur(request.getValeur());
        if (request.getDescription() != null) {
            config.setDescription(request.getDescription());
        }
        config = configurationRepository.save(config);

        // Sauvegarder dans Firebase si online
        if (firebaseConfigurationService.isOnline()) {
            log.info("Sauvegarde de la configuration dans Firebase: {}", config.getCle());
            firebaseConfigurationService.saveConfiguration(config);
        }

        return mapConfigToResponse(config);
    }

    private ConfigurationResponse mapConfigToResponse(Configuration config) {
        return ConfigurationResponse.builder()
                .id(config.getId())
                .cle(config.getCle())
                .valeur(config.getValeur())
                .description(config.getDescription())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    // ==================== MAPPING FIREBASE ====================

    /**
     * Mappe les données Firebase vers SignalementResponse.
     */
    private SignalementResponse mapFirebaseToResponse(FirebaseSignalementService.FirebaseSignalementData fb) {
        SignalementResponse.UserSummary createdBy = null;
        if (fb.getCreatedByEmail() != null) {
            createdBy = SignalementResponse.UserSummary.builder()
                    .email(fb.getCreatedByEmail())
                    .build();
        }

        return SignalementResponse.builder()
                .id(null) // ID local non disponible depuis Firebase
                .titre(fb.getTitre())
                .description(fb.getDescription())
                .latitude(fb.getLatitude())
                .longitude(fb.getLongitude())
                .adresse(fb.getAdresse())
                .statut(fb.getStatut())
                .surfaceImpactee(fb.getSurfaceImpactee())
                .niveau(fb.getNiveau())
                .budget(fb.getBudget())
                .entrepriseResponsable(fb.getEntrepriseResponsable())
                .dateDebut(fb.getDateDebut())
                .dateFinPrevue(fb.getDateFinPrevue())
                .dateFinReelle(fb.getDateFinReelle())
                .dateNouveau(fb.getDateNouveau())
                .dateEnCours(fb.getDateEnCours())
                .dateTermine(fb.getDateTermine())
                .pourcentageAvancement(fb.getPourcentageAvancement())
                .priorite(fb.getPriorite())
                .type(fb.getType())
                .photoUrl(fb.getPhotoUrl())
                .syncId(fb.getSyncId())
                .isSynced(fb.getIsSynced())
                .createdAt(fb.getCreatedAt())
                .updatedAt(fb.getUpdatedAt())
                .createdBy(createdBy)
                .build();
    }

    /**
     * Mappe les données Firebase Configuration vers ConfigurationResponse.
     */
    private ConfigurationResponse mapFirebaseConfigToResponse(FirebaseConfigurationService.FirebaseConfigurationData fb) {
        return ConfigurationResponse.builder()
                .id(null)
                .cle(fb.getCle())
                .valeur(fb.getValeur())
                .description(fb.getDescription())
                .updatedAt(fb.getUpdatedAt())
                .build();
    }

    /**
     * Synchronise les données Firebase vers un signalement local.
     */
    private void syncFirebaseToLocal(Signalement local, FirebaseSignalementService.FirebaseSignalementData fb) {
        if (fb.getTitre() != null) local.setTitre(fb.getTitre());
        if (fb.getDescription() != null) local.setDescription(fb.getDescription());
        if (fb.getLatitude() != null) local.setLatitude(fb.getLatitude());
        if (fb.getLongitude() != null) local.setLongitude(fb.getLongitude());
        if (fb.getAdresse() != null) local.setAdresse(fb.getAdresse());
        if (fb.getStatut() != null) local.setStatut(fb.getStatut());
        if (fb.getSurfaceImpactee() != null) local.setSurfaceImpactee(fb.getSurfaceImpactee());
        if (fb.getNiveau() != null) local.setNiveau(fb.getNiveau());
        if (fb.getBudget() != null) local.setBudget(fb.getBudget());
        if (fb.getEntrepriseResponsable() != null) local.setEntrepriseResponsable(fb.getEntrepriseResponsable());
        if (fb.getDateDebut() != null) local.setDateDebut(fb.getDateDebut());
        if (fb.getDateFinPrevue() != null) local.setDateFinPrevue(fb.getDateFinPrevue());
        if (fb.getDateFinReelle() != null) local.setDateFinReelle(fb.getDateFinReelle());
        if (fb.getPourcentageAvancement() != null) local.setPourcentageAvancement(fb.getPourcentageAvancement());
        if (fb.getPriorite() != null) local.setPriorite(fb.getPriorite());
        if (fb.getType() != null) local.setType(fb.getType());
        if (fb.getPhotoUrl() != null) local.setPhotoUrl(fb.getPhotoUrl());
        if (fb.getIsActive() != null) local.setIsActive(fb.getIsActive());
        local.setIsSynced(true);
    }
}

