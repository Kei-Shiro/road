package com.road.project.road_back.repository;

import com.road.project.road_back.entity.Report;
import com.road.project.road_back.entity.ReportStatus;
import com.road.project.road_back.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReportedBy(User user);
    List<Report> findByStatus(ReportStatus status);
    List<Report> findByReportedById(Long userId);
    long countByStatus(ReportStatus status);
}

