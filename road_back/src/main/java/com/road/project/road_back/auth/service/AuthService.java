package com.road.project.road_back.auth.service;

import com.road.project.road_back.auth.dto.*;
import com.road.project.road_back.auth.entity.Role;
import com.road.project.road_back.auth.entity.Session;
import com.road.project.road_back.auth.entity.User;
import com.road.project.road_back.auth.repository.SessionRepository;
import com.road.project.road_back.auth.repository.UserRepository;
import com.road.project.road_back.config.JwtTokenProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service d'authentification.
 * Supporte Firebase Firestore quand une connexion Internet est disponible,
 * avec fallback sur la base de données locale.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final FirebaseUserService firebaseUserService;

    @Value("${app.session.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.session.lock-duration-minutes:30}")
    private int lockDurationMinutes;

    /**
     * Inscription d'un nouvel utilisateur.
     * Tente d'abord d'enregistrer sur Firebase si connexion disponible,
     * puis enregistre localement.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Vérifier si l'email existe déjà localement
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Tenter l'inscription sur Firebase si en ligne
        // Firebase Auth gère le mot de passe, on ne l'envoie PAS dans Firestore
        if (firebaseUserService.isOnline()) {
            log.info("Connexion Internet détectée - Inscription sur Firebase Auth + Firestore");
            Optional<String> firebaseId = firebaseUserService.createUserInFirebase(request);
            if (firebaseId.isPresent()) {
                log.info("Utilisateur créé sur Firebase Auth avec UID: {}", firebaseId.get());
            } else {
                log.info("Création Firebase échouée ou email déjà existant sur Firebase");
            }
        } else {
            log.info("Mode hors ligne - Inscription locale uniquement");
        }

        // Créer l'utilisateur localement (avec mot de passe hashé pour le mode offline)
        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .role(Role.UTILISATEUR)
                .build();

        user = userRepository.save(user);

        // Générer les tokens
        return generateAuthResponse(user);
    }

    /**
     * Connexion d'un utilisateur.
     *
     * Architecture Firebase Auth:
     * - Firebase Admin SDK ne peut PAS vérifier les mots de passe directement
     * - On vérifie si l'utilisateur existe dans Firebase et on récupère ses données
     * - L'authentification du mot de passe se fait localement
     * - Les données utilisateur (nom, rôle, etc.) sont synchronisées depuis Firestore
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        // Si en ligne, vérifier si l'utilisateur existe dans Firebase et récupérer ses données
        if (firebaseUserService.isOnline()) {
            log.info("Connexion Internet détectée - Vérification utilisateur Firebase");
            Optional<FirebaseUserService.FirebaseUserData> firebaseUser =
                    firebaseUserService.getUserByEmail(request.getEmail());

            if (firebaseUser.isPresent()) {
                log.info("Utilisateur trouvé dans Firebase: {}", request.getEmail());
                FirebaseUserService.FirebaseUserData fbData = firebaseUser.get();

                // Vérifier si le compte est verrouillé sur Firebase
                if (Boolean.TRUE.equals(fbData.getIsLocked())) {
                    throw new LockedException("Votre compte est verrouillé. Veuillez réessayer plus tard ou contacter un administrateur.");
                }

                // Synchroniser/créer l'utilisateur localement avec les données Firebase
                syncOrCreateLocalUser(fbData, request.getPassword());
            }
        } else {
            log.info("Mode hors ligne - Authentification locale uniquement");
        }

        // Authentification locale (vérifie le mot de passe)
        return authenticateLocally(request, ipAddress, userAgent);
    }

    /**
     * Authentification locale.
     * Vérifie le mot de passe localement et met à jour Firebase si en ligne.
     */
    private AuthResponse authenticateLocally(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

        // Vérifier le verrouillage automatique
        checkAndUnlockIfExpired(user);

        // Vérifier si le compte est verrouillé
        if (user.getIsLocked()) {
            throw new LockedException("Votre compte est verrouillé. Veuillez réessayer plus tard ou contacter un administrateur.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Réinitialiser les tentatives de connexion
            user.resetLoginAttempts();
            user.setIsOnline(true);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Mettre à jour le statut dans Firebase si en ligne
            firebaseUserService.updateOnlineStatus(user.getEmail(), true);

            // Créer la session
            return generateAuthResponseWithSession(user, ipAddress, userAgent);

        } catch (BadCredentialsException e) {
            handleFailedLogin(user);
            // Incrémenter les tentatives dans Firebase si en ligne
            firebaseUserService.incrementLoginAttempts(user.getEmail());
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
    }

    /**
     * Synchronise ou crée un utilisateur local depuis les données Firebase.
     * Les données de Firestore (nom, prénom, rôle, etc.) sont prioritaires.
     */
    private void syncOrCreateLocalUser(FirebaseUserService.FirebaseUserData fbData, String rawPassword) {
        Optional<User> existingUser = userRepository.findByEmail(fbData.getEmail());

        User user;
        if (existingUser.isPresent()) {
            // Mettre à jour l'utilisateur existant avec les données Firebase
            user = existingUser.get();
            user.setNom(fbData.getNom());
            user.setPrenom(fbData.getPrenom());
            user.setTelephone(fbData.getTelephone());
            user.setRole(fbData.getRole());
            user.setIsLocked(fbData.getIsLocked() != null ? fbData.getIsLocked() : false);
            user.setIsActive(fbData.getIsActive() != null ? fbData.getIsActive() : true);
            log.info("Utilisateur local synchronisé avec Firebase: {}", fbData.getEmail());
        } else {
            // Créer un nouvel utilisateur depuis Firebase
            user = User.builder()
                    .email(fbData.getEmail())
                    .password(passwordEncoder.encode(rawPassword))
                    .nom(fbData.getNom())
                    .prenom(fbData.getPrenom())
                    .telephone(fbData.getTelephone())
                    .role(fbData.getRole())
                    .isLocked(fbData.getIsLocked() != null ? fbData.getIsLocked() : false)
                    .isActive(fbData.getIsActive() != null ? fbData.getIsActive() : true)
                    .build();
            log.info("Nouvel utilisateur créé localement depuis Firebase: {}", fbData.getEmail());
        }

        userRepository.save(user);
    }

    /**
     * Gère une tentative de connexion échouée.
     */
    private void handleFailedLogin(User user) {
        user.incrementLoginAttempts();

        if (user.getLoginAttempts() >= maxAttempts) {
            user.lockAccount();
        }

        userRepository.save(user);
    }

    /**
     * Vérifie et déverrouille le compte si le temps de verrouillage est écoulé.
     */
    private void checkAndUnlockIfExpired(User user) {
        if (user.getIsLocked() && user.getLockedAt() != null) {
            LocalDateTime unlockTime = user.getLockedAt().plusMinutes(lockDurationMinutes);
            if (LocalDateTime.now().isAfter(unlockTime)) {
                user.unlockAccount();
                userRepository.save(user);
            }
        }
    }

    /**
     * Déconnexion d'un utilisateur.
     * Met à jour le statut en ligne dans Firebase si connexion disponible.
     */
    @Transactional
    public void logout(String token) {
        sessionRepository.findByTokenAndIsValidTrue(token)
                .ifPresent(session -> {
                    session.invalidate();
                    session.getUser().setIsOnline(false);
                    sessionRepository.save(session);
                    userRepository.save(session.getUser());

                    // Mettre à jour le statut dans Firebase si en ligne
                    firebaseUserService.updateOnlineStatus(session.getUser().getEmail(), false);
                });
    }

    /**
     * Rafraîchit le token d'accès.
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        Session session = sessionRepository.findByRefreshTokenAndIsValidTrue(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Refresh token invalide"));

        if (session.getRefreshExpiresAt().isBefore(LocalDateTime.now())) {
            session.invalidate();
            sessionRepository.save(session);
            throw new RuntimeException("Refresh token expiré");
        }

        // Invalider l'ancienne session
        session.invalidate();
        sessionRepository.save(session);

        // Créer une nouvelle session
        return generateAuthResponseWithSession(session.getUser(), null, null);
    }

    /**
     * Récupère le profil de l'utilisateur connecté.
     */
    public AuthResponse.UserDto getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return mapToUserDto(user);
    }

    /**
     * Met à jour le profil de l'utilisateur.
     * Met à jour dans Firebase si connexion disponible, puis localement.
     */
    @Transactional
    public AuthResponse.UserDto updateProfile(UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Mettre à jour dans Firebase si en ligne
        if (firebaseUserService.isOnline()) {
            log.info("Connexion Internet détectée - Mise à jour Firebase");
            boolean firebaseUpdated = firebaseUserService.updateUserInFirebase(email, request);
            if (firebaseUpdated) {
                log.info("Profil mis à jour dans Firebase pour: {}", email);
            } else {
                log.warn("Mise à jour Firebase échouée pour: {}", email);
            }
        } else {
            log.info("Mode hors ligne - Mise à jour locale uniquement");
        }

        // Mise à jour locale
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getTelephone() != null) {
            user.setTelephone(request.getTelephone());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Cet email est déjà utilisé");
            }
            user.setEmail(request.getEmail());
        }

        user = userRepository.save(user);
        return mapToUserDto(user);
    }

    /**
     * Déverrouille un compte utilisateur (API publique avec token).
     * Déverrouille dans Firebase si connexion disponible, puis localement.
     */
    @Transactional
    public void unlockAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Déverrouiller dans Firebase si en ligne
        if (firebaseUserService.isOnline()) {
            log.info("Déverrouillage du compte dans Firebase: {}", email);
            firebaseUserService.unlockAccountInFirebase(email);
        }

        user.unlockAccount();
        userRepository.save(user);
    }

    /**
     * Déverrouille un compte utilisateur (par Manager).
     * Déverrouille dans Firebase si connexion disponible, puis localement.
     */
    @Transactional
    public void unlockAccountByManager(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Déverrouiller dans Firebase si en ligne
        if (firebaseUserService.isOnline()) {
            log.info("Déverrouillage du compte dans Firebase (Manager): {}", user.getEmail());
            firebaseUserService.unlockAccountInFirebase(user.getEmail());
        }

        user.unlockAccount();
        userRepository.save(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationDurationSeconds())
                .user(mapToUserDto(user))
                .build();
    }

    private AuthResponse generateAuthResponseWithSession(User user, String ipAddress, String userAgent) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Créer la session
        Session session = Session.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtTokenProvider.getExpirationDurationSeconds()))
                .refreshExpiresAt(LocalDateTime.now().plusDays(7))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        sessionRepository.save(session);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationDurationSeconds())
                .user(mapToUserDto(user))
                .build();
    }

    private AuthResponse.UserDto mapToUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .isOnline(user.getIsOnline())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Récupère tous les utilisateurs (pour Manager/Admin).
     */
    public java.util.List<UserListResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserListResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Crée un utilisateur (par Manager/Admin).
     */
    @Transactional
    public UserListResponse createUserByAdmin(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(request.getTelephone())
                .role(request.getRole())
                .build();

        user = userRepository.save(user);
        return mapToUserListResponse(user);
    }

    /**
     * Récupère un utilisateur par ID.
     */
    public UserListResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToUserListResponse(user);
    }

    /**
     * Supprime un utilisateur par ID.
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        userRepository.delete(user);
    }

    private UserListResponse mapToUserListResponse(User user) {
        return UserListResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .isLocked(user.getIsLocked())
                .isOnline(user.getIsOnline())
                .isActive(user.getIsActive())
                .loginAttempts(user.getLoginAttempts())
                .lockedAt(user.getLockedAt())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
