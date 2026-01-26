package com.road.project.road_back.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la configuration de la carte.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapConfigResponse {

    private Double centerLat;
    private Double centerLng;
    private Integer defaultZoom;
    private Integer minZoom;
    private Integer maxZoom;
    private BoundsDto bounds;
    private String tileServerUrl;
    private Boolean offlineEnabled;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundsDto {
        private Double northLat;
        private Double southLat;
        private Double eastLng;
        private Double westLng;
    }
}
