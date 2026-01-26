package com.road.project.road_back.signalement.controller;

import com.road.project.road_back.signalement.dto.*;
import com.road.project.road_back.signalement.entity.StatutSignalement;
import com.road.project.road_back.signalement.service.SignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les signalements.
 */
@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "API de gestion des signalements de travaux routiers")
public class SignalementController {

    private final SignalementService signalementService;

    @GetMapping
    @Operation(summary = "Récupérer tous les signalements (paginés)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des signalements")
    })
    public ResponseEntity<Page<SignalementResponse>> getAllSignalements(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(signalementService.getAllSignalements(pageable));
    }

    @GetMapping("/statut/{statut}")
    @Operation(summary = "Récupérer les signalements par statut")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des signalements filtrés")
    })
    public ResponseEntity<Page<SignalementResponse>> getSignalementsByStatut(
            @PathVariable StatutSignalement statut,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(signalementService.getSignalementsByStatut(statut, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un signalement par ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signalement trouvé"),
            @ApiResponse(responseCode = "404", description = "Signalement non trouvé")
    })
    public ResponseEntity<SignalementResponse> getSignalementById(@PathVariable Long id) {
        return ResponseEntity.ok(signalementService.getSignalementById(id));
    }

    @GetMapping("/bounds")
    @Operation(summary = "Récupérer les signalements dans une zone géographique")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des signalements dans la zone")
    })
    public ResponseEntity<List<SignalementResponse>> getSignalementsByBounds(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLng) {
        return ResponseEntity.ok(signalementService.getSignalementsByBounds(minLat, maxLat, minLng, maxLng));
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau signalement", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signalement créé"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<SignalementResponse> createSignalement(
            @Valid @RequestBody SignalementRequest request) {
        return ResponseEntity.ok(signalementService.createSignalement(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un signalement", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signalement mis à jour"),
            @ApiResponse(responseCode = "400", description = "Données invalides"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "404", description = "Signalement non trouvé")
    })
    public ResponseEntity<SignalementResponse> updateSignalement(
            @PathVariable Long id,
            @Valid @RequestBody SignalementRequest request) {
        return ResponseEntity.ok(signalementService.updateSignalement(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Supprimer un signalement (Manager)", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Signalement supprimé"),
            @ApiResponse(responseCode = "401", description = "Non authentifié"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Signalement non trouvé")
    })
    public ResponseEntity<Map<String, String>> deleteSignalement(@PathVariable Long id) {
        signalementService.deleteSignalement(id);
        return ResponseEntity.ok(Map.of("message", "Signalement supprimé avec succès"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Récupérer les statistiques des signalements")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Statistiques récupérées")
    })
    public ResponseEntity<SignalementStatsResponse> getStats() {
        return ResponseEntity.ok(signalementService.getStats());
    }

    @PostMapping("/sync")
    @Operation(summary = "Synchroniser les signalements offline", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Synchronisation effectuée"),
            @ApiResponse(responseCode = "401", description = "Non authentifié")
    })
    public ResponseEntity<SyncResponse> syncSignalements(@RequestBody SyncRequest request) {
        return ResponseEntity.ok(signalementService.syncSignalements(request));
    }
}

