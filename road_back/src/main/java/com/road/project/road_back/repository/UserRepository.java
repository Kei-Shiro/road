package com.road.project.road_back.repository;

import com.road.project.road_back.entity.User;
import com.road.project.road_back.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndPassword(String email, String password);
    List<User> findByStatus(UserStatus status);
    boolean existsByEmail(String email);
}

