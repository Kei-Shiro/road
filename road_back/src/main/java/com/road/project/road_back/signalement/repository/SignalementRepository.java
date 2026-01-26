package com.road.project.road_back.signalement.repository;

import com.road.project.road_back.signalement.entity.Signalement;
import com.road.project.road_back.signalement.entity.StatutSignalement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Signalement.
 */
@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    Page<Signalement> findByIsActiveTrue(Pageable pageable);

    Page<Signalement> findByStatutAndIsActiveTrue(StatutSignalement statut, Pageable pageable);

    List<Signalement> findByCreatedByIdAndIsActiveTrue(Long userId);

    Optional<Signalement> findBySyncIdAndIsActiveTrue(String syncId);

    @Query("SELECT s FROM Signalement s WHERE s.isActive = true AND " +
           "s.latitude BETWEEN :minLat AND :maxLat AND " +
           "s.longitude BETWEEN :minLng AND :maxLng")
    List<Signalement> findByBounds(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng);

    @Query("SELECT s FROM Signalement s WHERE s.isActive = true AND s.updatedAt > :since")
    List<Signalement> findModifiedSince(@Param("since") LocalDateTime since);

    // Statistiques
    @Query("SELECT COUNT(s) FROM Signalement s WHERE s.isActive = true")
    Long countActive();

    @Query("SELECT COUNT(s) FROM Signalement s WHERE s.isActive = true AND s.statut = :statut")
    Long countByStatut(@Param("statut") StatutSignalement statut);

    @Query("SELECT COALESCE(SUM(s.surfaceImpactee), 0) FROM Signalement s WHERE s.isActive = true")
    Double sumSurfaceImpactee();

    @Query("SELECT COALESCE(SUM(s.budget), 0) FROM Signalement s WHERE s.isActive = true")
    BigDecimal sumBudget();

    @Query("SELECT COALESCE(AVG(s.pourcentageAvancement), 0) FROM Signalement s WHERE s.isActive = true")
    Double avgPourcentageAvancement();

    @Query("SELECT s.entrepriseResponsable, COUNT(s) FROM Signalement s " +
           "WHERE s.isActive = true AND s.entrepriseResponsable IS NOT NULL " +
           "GROUP BY s.entrepriseResponsable ORDER BY COUNT(s) DESC")
    List<Object[]> countByEntreprise();

    @Query("SELECT s.statut, COUNT(s) FROM Signalement s WHERE s.isActive = true GROUP BY s.statut")
    List<Object[]> countGroupByStatut();
}

