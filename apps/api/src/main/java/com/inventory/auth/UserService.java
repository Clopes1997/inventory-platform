package com.inventory.auth;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.inventory.auth.dto.CreateUserRequestDto;
import com.inventory.auth.dto.UpdateUserRequestDto;
import com.inventory.auth.dto.UserResponseDto;
import com.inventory.common.ConflictException;
import com.inventory.common.ForbiddenException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findEntityByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
    }

    public boolean isAdmin(String username) {
        return userRepository.findByUsername(username)
                .map(User::isAdmin)
                .orElse(false);
    }

    private static boolean isValidRole(String role) {
        return "ADMIN".equals(role) || "OPERATOR".equals(role) || "VIEWER".equals(role);
    }

    public List<UserResponseDto> listUsers(String currentUsername) {
        requireAdmin(currentUsername);
        return userRepository.listAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponseDto getCurrentUser(String username) {
        User user = findEntityByUsername(username);
        return toResponse(user);
    }

    public UserResponseDto getUser(Long id, String currentUsername) {
        User user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
        if (!currentUsername.equals(user.getUsername()) && !isAdmin(currentUsername)) {
            throw new ForbiddenException("Not allowed to view this user");
        }
        return toResponse(user);
    }

    @Transactional
    public UserResponseDto createUser(CreateUserRequestDto dto, String currentUsername) {
        requireAdmin(currentUsername);
        if (userRepository.findByUsername(dto.getUsername().trim()).isPresent()) {
            throw new ConflictException("Username already exists: " + dto.getUsername());
        }
        User user = new User();
        user.setUsername(dto.getUsername().trim());
        user.setPasswordHash(BCrypt.withDefaults().hashToString(10, dto.getPassword().toCharArray()));
        user.setRole(dto.getRole() != null && isValidRole(dto.getRole()) ? dto.getRole() : "VIEWER");
        userRepository.persist(user);
        return toResponse(user);
    }

    @Transactional
    public UserResponseDto updateUser(Long id, UpdateUserRequestDto dto, String currentUsername) {
        User user = userRepository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
        boolean isSelf = currentUsername.equals(user.getUsername());
        if (!isSelf && !isAdmin(currentUsername)) {
            throw new ForbiddenException("Not allowed to update this user");
        }
        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            String newUsername = dto.getUsername().trim();
            if (!newUsername.equals(user.getUsername()) && userRepository.findByUsername(newUsername).isPresent()) {
                throw new ConflictException("Username already exists: " + newUsername);
            }
            user.setUsername(newUsername);
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (!isSelf) {
                throw new ForbiddenException("Only the user can change their own password");
            }
            user.setPasswordHash(BCrypt.withDefaults().hashToString(10, dto.getPassword().toCharArray()));
        }
        if (isAdmin(currentUsername) && dto.getRole() != null && isValidRole(dto.getRole()) && !isSelf) {
            user.setRole(dto.getRole());
        }
        userRepository.persist(user);
        return toResponse(user);
    }

    private void requireAdmin(String username) {
        if (!isAdmin(username)) {
            throw new ForbiddenException("Admin required");
        }
    }

    private UserResponseDto toResponse(User u) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setRole(u.getRole());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}
