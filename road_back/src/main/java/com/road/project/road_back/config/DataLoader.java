package com.road.project.road_back.config;

import com.road.project.road_back.entity.*;
import com.road.project.road_back.repository.ReportRepository;
import com.road.project.road_back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    @Override
    public void run(String... args) {
        // Charger les données seulement si la base est vide
        if (userRepository.count() == 0) {
            loadUsers();
        }
        if (reportRepository.count() == 0) {
            loadReports();
        }
    }

    private void loadUsers() {
        // Manager par défaut
        User admin = User.builder()
                .name("Admin TravauxTana")
                .email("admin@travauxana.mg")
                .password("admin123")
                .role(UserRole.MANAGER)
                .status(UserStatus.ACTIF)
                .dateCreated(LocalDate.of(2025, 1, 1))
                .reportsCount(0)
                .build();
        userRepository.save(admin);

        // Utilisateurs
        User user1 = User.builder()
                .name("Jean Rakoto")
                .email("jean.rakoto@email.mg")
                .password("user123")
                .role(UserRole.UTILISATEUR)
                .status(UserStatus.ACTIF)
                .dateCreated(LocalDate.of(2025, 10, 15))
                .reportsCount(5)
                .build();
        userRepository.save(user1);

        User user2 = User.builder()
                .name("Marie Andria")
                .email("marie.andria@email.mg")
                .password("user123")
                .role(UserRole.UTILISATEUR)
                .status(UserStatus.ACTIF)
                .dateCreated(LocalDate.of(2025, 11, 2))
                .reportsCount(4)
                .build();
        userRepository.save(user2);

        User user3 = User.builder()
                .name("Paul Rabe")
                .email("paul.rabe@email.mg")
                .password("user123")
                .role(UserRole.UTILISATEUR)
                .status(UserStatus.BLOQUE)
                .dateCreated(LocalDate.of(2025, 9, 20))
                .reportsCount(3)
                .build();
        userRepository.save(user3);

        User user4 = User.builder()
                .name("Hery Razafindrakoto")
                .email("hery.razaf@email.mg")
                .password("user123")
                .role(UserRole.UTILISATEUR)
                .status(UserStatus.ACTIF)
                .dateCreated(LocalDate.of(2025, 12, 1))
                .reportsCount(0)
                .build();
        userRepository.save(user4);

        User user5 = User.builder()
                .name("Nirina Rasoamanana")
                .email("nirina.rasoa@email.mg")
                .password("user123")
                .role(UserRole.UTILISATEUR)
                .status(UserStatus.BLOQUE)
                .dateCreated(LocalDate.of(2025, 8, 15))
                .reportsCount(2)
                .build();
        userRepository.save(user5);
    }

    private void loadReports() {
        User user1 = userRepository.findByEmail("jean.rakoto@email.mg").orElse(null);
        User user2 = userRepository.findByEmail("marie.andria@email.mg").orElse(null);
        User user3 = userRepository.findByEmail("paul.rabe@email.mg").orElse(null);

        if (user1 == null || user2 == null || user3 == null) return;

        // Report 1
        reportRepository.save(Report.builder()
                .lat(-18.8750).lng(47.5200)
                .address("Avenue de l'Indépendance")
                .type(ProblemType.NID_POULE)
                .description("Plusieurs nids de poule profonds sur la voie principale")
                .status(ReportStatus.EN_COURS)
                .date(LocalDate.of(2026, 1, 15))
                .surface(45.5).budget(15000000L)
                .company("COLAS Madagascar")
                .reportedBy(user1).build());

        // Report 2
        reportRepository.save(Report.builder()
                .lat(-18.8820).lng(47.5150)
                .address("Rue Ravoninahitriniarivo")
                .type(ProblemType.FISSURE)
                .description("Grande fissure traversant la route sur 20 mètres")
                .status(ReportStatus.NOUVEAU)
                .date(LocalDate.of(2026, 1, 18))
                .surface(120.0)
                .reportedBy(user2).build());

        // Report 3
        reportRepository.save(Report.builder()
                .lat(-18.8700).lng(47.5050)
                .address("Boulevard de l'Europe, Isoraka")
                .type(ProblemType.EFFONDREMENT)
                .description("Effondrement partiel de la chaussée suite aux pluies")
                .status(ReportStatus.EN_COURS)
                .date(LocalDate.of(2026, 1, 10))
                .surface(85.0).budget(25000000L)
                .company("SOGEA SATOM")
                .reportedBy(user1).build());

        // Report 4
        reportRepository.save(Report.builder()
                .lat(-18.8680).lng(47.5180)
                .address("Analakely - Place du marché")
                .type(ProblemType.INONDATION)
                .description("Zone régulièrement inondée, drainage défaillant")
                .status(ReportStatus.TERMINE)
                .date(LocalDate.of(2025, 12, 20))
                .surface(200.0).budget(35000000L)
                .company("ENTREPRISE RAZAFY")
                .reportedBy(user3).build());

        // Report 5
        reportRepository.save(Report.builder()
                .lat(-18.8850).lng(47.5100)
                .address("Pont de Behoririka")
                .type(ProblemType.FISSURE)
                .description("Fissures multiples sur le tablier du pont")
                .status(ReportStatus.NOUVEAU)
                .date(LocalDate.of(2026, 1, 17))
                .surface(65.0)
                .reportedBy(user2).build());

        // Report 6
        reportRepository.save(Report.builder()
                .lat(-18.8760).lng(47.5250)
                .address("67 Ha, près du stade")
                .type(ProblemType.NID_POULE)
                .description("Série de nids de poule dangereux")
                .status(ReportStatus.EN_COURS)
                .date(LocalDate.of(2026, 1, 8))
                .surface(55.0).budget(12000000L)
                .company("TRAVAUX PUBLICS MADA")
                .reportedBy(user1).build());

        // Report 7
        reportRepository.save(Report.builder()
                .lat(-18.8900).lng(47.5180)
                .address("Lac Anosy - Boulevard")
                .type(ProblemType.AUTRE)
                .description("Revêtement complètement dégradé sur 50m")
                .status(ReportStatus.TERMINE)
                .date(LocalDate.of(2025, 12, 15))
                .surface(180.0).budget(28000000L)
                .company("COLAS Madagascar")
                .reportedBy(user3).build());

        // Report 8
        reportRepository.save(Report.builder()
                .lat(-18.8720).lng(47.5120)
                .address("Gare Soarano")
                .type(ProblemType.EFFONDREMENT)
                .description("Affaissement de la route près de la gare")
                .status(ReportStatus.EN_COURS)
                .date(LocalDate.of(2026, 1, 12))
                .surface(75.0).budget(18000000L)
                .company("BTP CONSTRUCTION")
                .reportedBy(user2).build());

        // Report 9
        reportRepository.save(Report.builder()
                .lat(-18.8800).lng(47.5220)
                .address("Ambohijatovo")
                .type(ProblemType.NID_POULE)
                .description("Nids de poule sur la montée")
                .status(ReportStatus.NOUVEAU)
                .date(LocalDate.of(2026, 1, 19))
                .surface(40.0)
                .reportedBy(user1).build());

        // Report 10
        reportRepository.save(Report.builder()
                .lat(-18.8650).lng(47.5090)
                .address("Tsaralalana")
                .type(ProblemType.INONDATION)
                .description("Problème de drainage récurrent")
                .status(ReportStatus.EN_COURS)
                .date(LocalDate.of(2026, 1, 5))
                .surface(150.0).budget(22000000L)
                .company("SOGEA SATOM")
                .reportedBy(user3).build());

        // Report 11
        reportRepository.save(Report.builder()
                .lat(-18.8780).lng(47.5030)
                .address("Anosy - Route circulaire")
                .type(ProblemType.FISSURE)
                .description("Fissures longitudinales importantes")
                .status(ReportStatus.TERMINE)
                .date(LocalDate.of(2025, 11, 28))
                .surface(95.0).budget(15000000L)
                .company("ENTREPRISE RAZAFY")
                .reportedBy(user2).build());

        // Report 12
        reportRepository.save(Report.builder()
                .lat(-18.8830).lng(47.5070)
                .address("Ampefiloha")
                .type(ProblemType.AUTRE)
                .description("Marquage au sol effacé et bordures cassées")
                .status(ReportStatus.NOUVEAU)
                .date(LocalDate.of(2026, 1, 20))
                .surface(110.0)
                .reportedBy(user1).build());
    }
}

