package com.federation.clubs.service;

import com.federation.athletes.entity.AthleteStatus;
import com.federation.athletes.repository.AthleteRepository;
import com.federation.clubs.dto.ClubRequest;
import com.federation.clubs.dto.ClubResponse;
import com.federation.clubs.entity.Club;
import com.federation.clubs.entity.ClubStatus;
import com.federation.clubs.mapper.ClubMapper;
import com.federation.clubs.repository.ClubRepository;
import com.federation.common.exception.ForbiddenException;
import com.federation.common.exception.ResourceAlreadyExistsException;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.response.PagedResponse;
import com.federation.users.entity.User;
import com.federation.users.entity.UserRole;
import com.federation.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.Objects;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final AthleteRepository athleteRepository;
    private final UserRepository userRepository;
    private final ClubMapper     clubMapper;

    // ── Read ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<ClubResponse> findAll(String search, String status, Pageable pageable) {
    ClubStatus clubStatus = null;
    if (status != null && !status.isBlank()) {
        try { clubStatus = ClubStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException ignored) {}
    }
    final ClubStatus cs = clubStatus;

    List<Club> all = clubRepository.findAll();
    List<ClubResponse> filtered = all.stream()
        .filter(c -> search == null || search.isBlank() ||
                c.getName().toLowerCase().contains(search.toLowerCase()) ||
                (c.getCity() != null && c.getCity().toLowerCase().contains(search.toLowerCase())))
        .filter(c -> cs == null || c.getStatus() == cs)
        .map(this::toResponse)
        .collect(Collectors.toList());

    int from = Math.min(pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
    int to   = Math.min(from + pageable.getPageSize(), filtered.size());

    return PagedResponse.of(new PageImpl<>(filtered.subList(from, to), pageable, filtered.size()));
}

    @Transactional(readOnly = true)
    public ClubResponse findById(UUID id) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", id));
        return toResponse(club);
    }

    @Transactional(readOnly = true)
    public ClubResponse findBySlug(String slug) {
        Club club = clubRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "slug", slug));
        return toResponse(club);
    }

    // ── Write ─────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ClubResponse create(ClubRequest request) {
        normalize(request);
        if (clubRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ResourceAlreadyExistsException(
                    "A club named '" + request.getName() + "' already exists.");
        }
        if (clubRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new ResourceAlreadyExistsException(
                    "A club with license number '" + request.getLicenseNumber() + "' already exists.");
        }
        Club club = clubMapper.toEntity(request);
        club.setSlug(generateUniqueSlug(request.getName()));
        resolveManager(club, request.getManagerId());
        if (request.getStatus() == null) club.setStatus(ClubStatus.ACTIVE);
        Club saved = clubRepository.save(club);
        log.info("Club created: {} ({})", saved.getName(), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF','ROLE_CLUB_MANAGER')")
    public ClubResponse update(UUID id, ClubRequest request) {
        normalize(request);
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Club", "id", id));

        User currentUser = getCurrentUser();
        boolean isClubManager = currentUser.getRole() == UserRole.ROLE_CLUB_MANAGER;
        if (isClubManager && (club.getManager() == null || !club.getManager().getId().equals(currentUser.getId()))) {
            throw new ForbiddenException("Club managers can only update their own club.");
        }

        if (request.getName() != null && !request.getName().equalsIgnoreCase(club.getName())
            && clubRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ResourceAlreadyExistsException(
                "A club named '" + request.getName() + "' already exists.");
        }

        if (request.getLicenseNumber() != null && !Objects.equals(request.getLicenseNumber(), club.getLicenseNumber())
            && clubRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new ResourceAlreadyExistsException(
                "A club with license number '" + request.getLicenseNumber() + "' already exists.");
        }

        clubMapper.updateEntity(request, club);
        if (isClubManager && request.getManagerId() != null
                && (club.getManager() == null || !request.getManagerId().equals(club.getManager().getId()))) {
            throw new ForbiddenException("Club managers cannot reassign club manager.");
        }
        resolveManager(club, request.getManagerId());
        Club saved = clubRepository.save(club);
        log.info("Club updated: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void delete(UUID id) {
        if (!clubRepository.existsById(id)) {
            throw new ResourceNotFoundException("Club", "id", id);
        }
        clubRepository.deleteById(id);
        log.info("Club deleted: {}", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void resolveManager(Club club, java.util.UUID managerId) {
        if (managerId != null) {
            User manager = userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", managerId));
            club.setManager(manager);
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ForbiddenException("Authentication is required.");
        }

        String principal = auth.getName();
        return userRepository.findByEmailOrUsername(principal)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", principal));
    }

    private String generateUniqueSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String slug = base;
        int counter = 1;
        while (clubRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private void normalize(ClubRequest request) {
        if (request.getName() != null) {
            request.setName(request.getName().trim());
        }
        if (request.getLicenseNumber() != null) {
            request.setLicenseNumber(request.getLicenseNumber().trim());
        }
        if (request.getShortName() != null && !request.getShortName().isBlank()) {
            request.setShortName(request.getShortName().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getCountry() != null && !request.getCountry().isBlank()) {
            request.setCountry(request.getCountry().trim());
        }
    }

    private ClubResponse toResponse(Club club) {
        ClubResponse response = clubMapper.toResponse(club);
        response.setActiveAthletes(athleteRepository.countByClubId(club.getId()));
        return response;
    }
}
