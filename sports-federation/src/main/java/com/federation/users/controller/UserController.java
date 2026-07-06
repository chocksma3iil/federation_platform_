package com.federation.users.controller;

import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.exception.ResourceAlreadyExistsException;
import com.federation.common.response.ApiResponse;
import com.federation.common.response.PagedResponse;
import com.federation.athletes.entity.Athlete;
import com.federation.athletes.repository.AthleteRepository;
import com.federation.users.entity.User;
import com.federation.users.entity.UserRole;
import com.federation.users.entity.UserStatus;
import com.federation.users.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Users", description = "User management endpoints")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AthleteRepository athleteRepository;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "List users")
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Sort s = sortParts.length > 1
                ? Sort.by(Sort.Direction.fromString(sortParts[1]), sortParts[0])
                : Sort.by(Sort.Direction.DESC, "createdAt");

        UserRole roleFilter = parseRole(role);
        UserStatus statusFilter = parseStatus(status);

        String normalizedSearch = normalize(search);
        PageRequest pageRequest = PageRequest.of(page, size, s);
        Page<User> result;
        if (normalizedSearch == null || normalizedSearch.isBlank()) {
            result = findWithoutSearch(roleFilter, statusFilter, pageRequest);
        } else {
            result = findWithSearch(normalizedSearch, roleFilter, statusFilter, pageRequest);
        }

        List<UserResponse> mapped = result.getContent().stream().map(UserController::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.of(result, mapped)));
    }

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id:[0-9a-fA-F-]{36}}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return ResponseEntity.ok(ApiResponse.ok(toResponse(user)));
    }

    @Operation(summary = "List athlete users, optionally filtered by club")
    @GetMapping("/athletes")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<AthleteUserResponse>>> listAthleteUsers(
            @RequestParam(required = false) UUID clubId) {
        List<Athlete> athletes = (clubId == null)
            ? athleteRepository.findAllWithUserAndClub()
            : athleteRepository.findAllByClubIdWithUserAndClub(clubId);

        List<AthleteUserResponse> mapped = athletes.stream()
            .filter(a -> a.getUser() != null && a.getUser().getRole() == UserRole.ROLE_ATHLETE)
            .map(a -> AthleteUserResponse.builder()
                .userId(a.getUser().getId())
                .athleteId(a.getId())
                .clubId(a.getClub() != null ? a.getClub().getId() : null)
                .firstName(a.getUser().getFirstName())
                .lastName(a.getUser().getLastName())
                .fullName(a.getUser().getFullName())
                .email(a.getUser().getEmail())
                .licenseNumber(a.getLicenseNumber())
                .build())
            .toList();

        return ResponseEntity.ok(ApiResponse.ok(mapped));
    }

    @Operation(summary = "List athlete users (compat alias)")
    @GetMapping("/athlete-users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AthleteUserResponse>>> listAthleteUsersAlias(
            @RequestParam(required = false) UUID clubId) {
        return listAthleteUsers(clubId);
    }

    @Operation(summary = "Create a user")
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ResourceAlreadyExistsException("A user with email '" + email + "' already exists.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ResourceAlreadyExistsException("A user with username '" + username + "' already exists.");
        }

        User created = userRepository.save(User.builder()
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(request.getRole())
                .status(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)
                .build());

        return ResponseEntity.status(201).body(ApiResponse.created(toResponse(created)));
    }

    private static String normalize(String input) {
        return input == null ? null : input.trim();
    }

    private Page<User> findWithoutSearch(UserRole role, UserStatus status, PageRequest pageRequest) {
        if (role != null && status != null) {
            return userRepository.findByRoleAndStatus(role, status, pageRequest);
        }
        if (role != null) {
            return userRepository.findByRole(role, pageRequest);
        }
        if (status != null) {
            return userRepository.findByStatus(status, pageRequest);
        }
        return userRepository.findAll(pageRequest);
    }

    private Page<User> findWithSearch(String search, UserRole role, UserStatus status, PageRequest pageRequest) {
        if (role != null && status != null) {
            return userRepository.searchByRoleAndStatus(search, role, status, pageRequest);
        }
        if (role != null) {
            return userRepository.searchByRole(search, role, pageRequest);
        }
        if (status != null) {
            return userRepository.searchByStatus(search, status, pageRequest);
        }
        return userRepository.search(search, pageRequest);
    }

    private static UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static UserStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return UserStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .username(u.getUsername())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .fullName(u.getFullName())
                .role(u.getRole())
                .status(u.getStatus())
                .phone(u.getPhone())
                .avatarUrl(u.getAvatarUrl())
                .lastLogin(u.getLastLogin())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    @Value
    @Builder
    private static class UserResponse {
        UUID id;
        String email;
        String username;
        String firstName;
        String lastName;
        String fullName;
        UserRole role;
        UserStatus status;
        String phone;
        String avatarUrl;
        Instant lastLogin;
        Instant createdAt;
        Instant updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    private static class CreateUserRequest {
        @NotBlank
        @Email
        String email;

        @NotBlank
        @Size(min = 3, max = 100)
        String username;

        @NotBlank
        @Size(min = 8)
        String password;

        @NotBlank
        String firstName;

        @NotBlank
        String lastName;

        @NotNull
        UserRole role;

        UserStatus status;
        String phone;
    }

    @Value
    @Builder
    private static class AthleteUserResponse {
        UUID userId;
        UUID athleteId;
        UUID clubId;
        String firstName;
        String lastName;
        String fullName;
        String email;
        String licenseNumber;
    }
}
