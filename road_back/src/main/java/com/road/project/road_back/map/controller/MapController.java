package com.road.project.road_back.map.controller;

import com.road.project.road_back.map.dto.MapConfigResponse;
import com.road.project.road_back.map.service.MapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

/**
 * Contrôleur REST pour la cartographie.
 */
@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
@Tag(name = "Cartographie", description = "API de gestion des cartes et tuiles")
public class MapController {

    private final MapService mapService;

    @GetMapping("/config")
    @Operation(summary = "Récupérer la configuration de la carte")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Configuration récupérée")
    })
    public ResponseEntity<MapConfigResponse> getMapConfig() {
        return ResponseEntity.ok(mapService.getMapConfig());
    }

    @GetMapping("/tiles/{z}/{x}/{y}")
    @Operation(summary = "Récupérer une tuile de carte")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tuile récupérée"),
            @ApiResponse(responseCode = "404", description = "Tuile non trouvée")
    })
    public ResponseEntity<Resource> getTile(
            @PathVariable int z,
            @PathVariable int x,
            @PathVariable int y) throws IOException {

        Resource tile = mapService.getTile(z, x, y);

        if (tile == null || !tile.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(tile);
    }

    @PostMapping("/preload")
    @Operation(summary = "Précharger les tuiles pour utilisation offline (Manager)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Préchargement lancé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    public ResponseEntity<String> preloadTiles(
            @RequestParam(defaultValue = "12") int minZoom,
            @RequestParam(defaultValue = "15") int maxZoom) {

        // Lancer le préchargement en async
        new Thread(() -> mapService.preloadTiles(minZoom, maxZoom)).start();

        return ResponseEntity.ok("Préchargement des tuiles lancé en arrière-plan");
    }
}

