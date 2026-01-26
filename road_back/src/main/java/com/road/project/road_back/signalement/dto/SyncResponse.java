package com.road.project.road_back.signalement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour la réponse de synchronisation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncResponse {

    private LocalDateTime syncTime;
    private List<SignalementResponse> created;
    private List<SignalementResponse> updated;
    private List<String> deleted;
    private List<SignalementResponse> serverChanges;
    private int conflictsResolved;
}

