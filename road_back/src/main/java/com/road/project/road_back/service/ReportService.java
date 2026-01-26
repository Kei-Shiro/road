package com.road.project.road_back.service;

import com.road.project.road_back.dto.ReportCreateDTO;
import com.road.project.road_back.dto.ReportDTO;
import com.road.project.road_back.dto.ReportUpdateDTO;
import com.road.project.road_back.dto.StatsDTO;
import com.road.project.road_back.entity.Report;
import com.road.project.road_back.entity.ReportStatus;
import com.road.project.road_back.entity.User;
import com.road.project.road_back.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserService userService;

    public List<ReportDTO> getAllReports() {
        return reportRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<ReportDTO> getReportById(Long id) {
        return reportRepository.findById(id).map(this::toDTO);
    }

    public List<ReportDTO> getReportsByUserId(Long userId) {
        return reportRepository.findByReportedById(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReportDTO> getReportsByStatus(ReportStatus status) {
        return reportRepository.findByStatus(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ReportDTO createReport(ReportCreateDTO createDTO) {
        User reportedBy = userService.findById(createDTO.getReportedById())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Report report = Report.builder()
                .lat(createDTO.getLat())
                .lng(createDTO.getLng())
                .address(createDTO.getAddress())
                .type(createDTO.getType())
                .description(createDTO.getDescription())
                .status(ReportStatus.NOUVEAU)
                .date(LocalDate.now())
                .reportedBy(reportedBy)
                .build();

        Report saved = reportRepository.save(report);
        userService.incrementReportsCount(createDTO.getReportedById());

        return toDTO(saved);
    }

    public Optional<ReportDTO> updateReport(Long id, ReportUpdateDTO updateDTO) {
        return reportRepository.findById(id)
                .map(report -> {
                    if (updateDTO.getAddress() != null) {
                        report.setAddress(updateDTO.getAddress());
                    }
                    if (updateDTO.getStatus() != null) {
                        report.setStatus(updateDTO.getStatus());
                    }
                    if (updateDTO.getSurface() != null) {
                        report.setSurface(updateDTO.getSurface());
                    }
                    if (updateDTO.getBudget() != null) {
                        report.setBudget(updateDTO.getBudget());
                    }
                    if (updateDTO.getCompany() != null) {
                        report.setCompany(updateDTO.getCompany());
                    }
                    return toDTO(reportRepository.save(report));
                });
    }

    public boolean deleteReport(Long id) {
        if (reportRepository.existsById(id)) {
            reportRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public StatsDTO getStats() {
        List<Report> allReports = reportRepository.findAll();

        int total = allReports.size();
        int nouveau = (int) allReports.stream().filter(r -> r.getStatus() == ReportStatus.NOUVEAU).count();
        int enCours = (int) allReports.stream().filter(r -> r.getStatus() == ReportStatus.EN_COURS).count();
        int termine = (int) allReports.stream().filter(r -> r.getStatus() == ReportStatus.TERMINE).count();

        double totalSurface = allReports.stream()
                .filter(r -> r.getSurface() != null)
                .mapToDouble(Report::getSurface)
                .sum();

        long totalBudget = allReports.stream()
                .filter(r -> r.getBudget() != null)
                .mapToLong(Report::getBudget)
                .sum();

        int progress = total > 0 ? Math.round((float) termine / total * 100) : 0;

        return StatsDTO.builder()
                .total(total)
                .nouveau(nouveau)
                .enCours(enCours)
                .termine(termine)
                .totalSurface(totalSurface)
                .totalBudget(totalBudget)
                .progress(progress)
                .build();
    }

    private ReportDTO toDTO(Report report) {
        return ReportDTO.builder()
                .id(report.getId())
                .lat(report.getLat())
                .lng(report.getLng())
                .address(report.getAddress())
                .type(report.getType())
                .description(report.getDescription())
                .status(report.getStatus())
                .date(report.getDate())
                .surface(report.getSurface())
                .budget(report.getBudget())
                .company(report.getCompany())
                .reportedById(report.getReportedBy() != null ? report.getReportedBy().getId() : null)
                .reportedByName(report.getReportedBy() != null ? report.getReportedBy().getName() : null)
                .build();
    }
}

