package com.road.project.road_back.map.service;

import com.road.project.road_back.map.dto.MapConfigResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Service de gestion des tuiles de carte.
 */
@Service
@Slf4j
public class MapService {

    @Value("${app.map.tiles-directory:./tiles}")
    private String tilesDirectory;

    @Value("${app.map.antananarivo.lat:-18.8792}")
    private Double centerLat;

    @Value("${app.map.antananarivo.lng:47.5079}")
    private Double centerLng;

    @Value("${app.map.antananarivo.default-zoom:13}")
    private Integer defaultZoom;

    private static final String OSM_TILE_SERVER = "https://tile.openstreetmap.org";

    /**
     * Récupère la configuration de la carte pour Antananarivo.
     */
    public MapConfigResponse getMapConfig() {
        return MapConfigResponse.builder()
                .centerLat(centerLat)
                .centerLng(centerLng)
                .defaultZoom(defaultZoom)
                .minZoom(10)
                .maxZoom(18)
                .bounds(MapConfigResponse.BoundsDto.builder()
                        .northLat(-18.7500)
                        .southLat(-19.0500)
                        .eastLng(47.6500)
                        .westLng(47.4000)
                        .build())
                .tileServerUrl("/api/map/tiles/{z}/{x}/{y}")
                .offlineEnabled(true)
                .build();
    }

    /**
     * Récupère une tuile de carte.
     * Essaie d'abord le cache local, puis télécharge depuis OSM si nécessaire.
     */
    public Resource getTile(int z, int x, int y) throws IOException {
        Path tilePath = getTilePath(z, x, y);

        // Vérifier le cache local
        if (Files.exists(tilePath)) {
            return new UrlResource(tilePath.toUri());
        }

        // Télécharger depuis OSM et mettre en cache
        try {
            downloadAndCacheTile(z, x, y, tilePath);
            if (Files.exists(tilePath)) {
                return new UrlResource(tilePath.toUri());
            }
        } catch (Exception e) {
            log.warn("Impossible de télécharger la tuile {}/{}/{}: {}", z, x, y, e.getMessage());
        }

        // Retourner une tuile vide ou générer une erreur
        return null;
    }

    /**
     * Télécharge une tuile depuis OSM et la met en cache.
     */
    private void downloadAndCacheTile(int z, int x, int y, Path tilePath) throws IOException {
        String tileUrl = String.format("%s/%d/%d/%d.png", OSM_TILE_SERVER, z, x, y);

        URL url = URI.create(tileUrl).toURL();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestProperty("User-Agent", "RoadSignalingApp/1.0");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);

        if (connection.getResponseCode() == 200) {
            // Créer les répertoires si nécessaire
            Files.createDirectories(tilePath.getParent());

            try (InputStream inputStream = connection.getInputStream()) {
                Files.copy(inputStream, tilePath, StandardCopyOption.REPLACE_EXISTING);
            }
        }

        connection.disconnect();
    }

    private Path getTilePath(int z, int x, int y) {
        return Paths.get(tilesDirectory, String.valueOf(z), String.valueOf(x), y + ".png");
    }

    /**
     * Pré-télécharge les tuiles pour une zone donnée.
     */
    public void preloadTiles(int minZoom, int maxZoom) {
        // Bounds d'Antananarivo
        double north = -18.75;
        double south = -19.05;
        double east = 47.65;
        double west = 47.40;

        for (int z = minZoom; z <= maxZoom; z++) {
            int[] nw = latLngToTile(north, west, z);
            int[] se = latLngToTile(south, east, z);

            for (int x = nw[0]; x <= se[0]; x++) {
                for (int y = nw[1]; y <= se[1]; y++) {
                    try {
                        getTile(z, x, y);
                        Thread.sleep(100); // Respecter les limites de rate d'OSM
                    } catch (Exception e) {
                        log.error("Erreur lors du préchargement de la tuile {}/{}/{}", z, x, y, e);
                    }
                }
            }
        }
    }

    private int[] latLngToTile(double lat, double lng, int zoom) {
        int n = (int) Math.pow(2, zoom);
        int x = (int) ((lng + 180.0) / 360.0 * n);
        int y = (int) ((1.0 - Math.log(Math.tan(Math.toRadians(lat)) + 1 / Math.cos(Math.toRadians(lat))) / Math.PI) / 2.0 * n);
        return new int[]{x, y};
    }
}

