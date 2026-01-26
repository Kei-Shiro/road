package com.road.project.road_back.service;

import com.road.project.road_back.dto.LoginDTO;
import com.road.project.road_back.dto.UserCreateDTO;
import com.road.project.road_back.dto.UserDTO;
import com.road.project.road_back.entity.User;
import com.road.project.road_back.entity.UserRole;
import com.road.project.road_back.entity.UserStatus;
import com.road.project.road_back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(this::toDTO);
    }

    public Optional<UserDTO> login(LoginDTO loginDTO) {
        return userRepository.findByEmailAndPassword(loginDTO.getEmail(), loginDTO.getPassword())
                .filter(user -> user.getStatus() == UserStatus.ACTIF)
                .map(this::toDTO);
    }

    public UserDTO createUser(UserCreateDTO createDTO) {
        if (userRepository.existsByEmail(createDTO.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = User.builder()
                .name(createDTO.getName())
                .email(createDTO.getEmail())
                .password(createDTO.getPassword())
                .role(createDTO.getRole() != null ? createDTO.getRole() : UserRole.UTILISATEUR)
                .status(UserStatus.ACTIF)
                .dateCreated(LocalDate.now())
                .reportsCount(0)
                .build();

        return toDTO(userRepository.save(user));
    }

    public Optional<UserDTO> blockUser(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(UserStatus.BLOQUE);
                    return toDTO(userRepository.save(user));
                });
    }

    public Optional<UserDTO> unblockUser(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(UserStatus.ACTIF);
                    return toDTO(userRepository.save(user));
                });
    }

    public void incrementReportsCount(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setReportsCount(user.getReportsCount() + 1);
            userRepository.save(user);
        });
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .dateCreated(user.getDateCreated())
                .reportsCount(user.getReportsCount())
                .build();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}

