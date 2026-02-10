package com.road.project.road_back.signalement.repository;

import com.road.project.road_back.signalement.entity.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour les configurations.
 */
@Repository
public interface ConfigurationRepository extends JpaRepository<Configuration, Long> {

    Optional<Configuration> findByCle(String cle);
}

