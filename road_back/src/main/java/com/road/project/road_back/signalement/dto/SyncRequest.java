package com.road.project.road_back.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour la synchronisation des signalements.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncRequest {

    private LocalDateTime lastSyncTime;
    private List<SignalementRequest> signalements;
    private List<String> deletedSyncIds;
}

