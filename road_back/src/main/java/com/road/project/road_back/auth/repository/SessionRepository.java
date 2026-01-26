package com.road.project.road_back.auth.repository;

import com.road.project.road_back.auth.entity.Session;
import com.road.project.road_back.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Session.
 */
@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByTokenAndIsValidTrue(String token);

    Optional<Session> findByRefreshTokenAndIsValidTrue(String refreshToken);

    List<Session> findByUserAndIsValidTrue(User user);

    @Modifying
    @Query("UPDATE Session s SET s.isValid = false WHERE s.user = :user")
    void invalidateAllUserSessions(User user);

    @Modifying
    @Query("UPDATE Session s SET s.isValid = false WHERE s.expiresAt < :now")
    void invalidateExpiredSessions(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM Session s WHERE s.expiresAt < :date AND s.isValid = false")
    void deleteOldInvalidSessions(LocalDateTime date);
}

