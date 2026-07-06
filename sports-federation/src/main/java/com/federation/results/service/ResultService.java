package com.federation.results.service;

import com.federation.athletes.entity.Athlete;
import com.federation.athletes.repository.AthleteRepository;
import com.federation.common.exception.ResourceAlreadyExistsException;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.response.PagedResponse;
import com.federation.competitions.entity.Competition;
import com.federation.competitions.entity.CompetitionEvent;
import com.federation.competitions.repository.CompetitionEventRepository;
import com.federation.competitions.repository.CompetitionRepository;
import com.federation.results.dto.ResultRequest;
import com.federation.results.dto.ResultResponse;
import com.federation.results.entity.Ranking;
import com.federation.results.entity.Result;
import com.federation.results.mapper.ResultMapper;
import com.federation.results.repository.RankingRepository;
import com.federation.results.repository.ResultRepository;
import com.federation.users.entity.User;
import com.federation.users.entity.UserRole;
import com.federation.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResultService {

    private final ResultRepository      resultRepository;
    private final RankingRepository     rankingRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionEventRepository eventRepository;
    private final AthleteRepository     athleteRepository;
    private final UserRepository        userRepository;
    private final ResultMapper          resultMapper;

    // ── Read ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<ResultResponse> findAll(UUID competitionId, UUID eventId,
                                                  UUID athleteId, String status,
                                                  Pageable pageable) {
        String rs = normalizeStatus(status);
        Specification<Result> spec = Specification.where(null);
        if (competitionId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("competition").get("id"), competitionId));
        }
        if (eventId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("event").get("id"), eventId));
        }
        if (athleteId != null) {
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.equal(root.get("athlete").get("id"), athleteId),
                    cb.equal(root.get("athlete").get("user").get("id"), athleteId)
            ));
        }
        if (rs != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), rs));
        }

        Page<Result> page = resultRepository.findAll(spec, pageable);

        // Enrich with ranking positions
        Page<ResultResponse> mapped = page.map(result -> {
            ResultResponse r = resultMapper.toResponse(result);
            enrichWithRanking(r, result);
            return r;
        });
        return PagedResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public ResultResponse findById(UUID id) {
        Result result = getOrThrow(id);
        ResultResponse r = resultMapper.toResponse(result);
        enrichWithRanking(r, result);
        return r;
    }

    @Transactional(readOnly = true)
    public List<ResultResponse> findByEventAndRound(UUID eventId, String round) {
        String r = (round == null || round.isBlank()) ? "FINAL" : round.toUpperCase();
        List<Ranking> rankings = rankingRepository.findByEventIdAndRoundOrderByRankPositionAsc(eventId, r);

        Map<UUID, Ranking> rankMap = rankings.stream()
                .collect(Collectors.toMap(rk -> rk.getResult().getId(), rk -> rk));

        return resultRepository.findByCompetitionIdAndEventIdAndRound(null, eventId, r)
                .stream()
                .map(result -> {
                    ResultResponse resp = resultMapper.toResponse(result);
                    Ranking rk = rankMap.get(result.getId());
                    if (rk != null) {
                        resp.setRankPosition(rk.getRankPosition());
                        if (rk.getMedal() != null) resp.setMedal(rk.getMedal().name());
                    }
                    return resp;
                })
                .collect(Collectors.toList());
    }

    // ── Write ─────────────────────────────────────────────────────────────

    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ResultResponse create(ResultRequest request) {
        Result result = resultMapper.toEntity(request);
        String normalizedRound = normalizeRound(result.getRound());
        String normalizedStatus = normalizePersistedStatus(result.getStatus());
        Athlete athlete = resolveAthleteFromAthleteOrUserId(request.getAthleteId());
        ensureUniqueResult(athlete.getId(), request.getEventId(), normalizedRound, null);
        resolveRelations(result, request, athlete);
        result.setStatus(normalizedStatus);
        result.setRound(normalizedRound);
        Result saved = resultRepository.save(result);
        log.info("Result recorded for athlete {} in event {}", athlete.getId(), request.getEventId());
        return resultMapper.toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ResultResponse update(UUID id, ResultRequest request) {
        Result result = getOrThrow(id);
        resultMapper.updateEntity(request, result);
        String normalizedRound = normalizeRound(result.getRound());
        String normalizedStatus = normalizePersistedStatus(result.getStatus());
        Athlete athlete = resolveAthleteFromAthleteOrUserId(request.getAthleteId());
        ensureUniqueResult(athlete.getId(), request.getEventId(), normalizedRound, id);
        resolveRelations(result, request, athlete);
        result.setStatus(normalizedStatus);
        result.setRound(normalizedRound);
        Result saved = resultRepository.save(result);
        log.info("Result updated: {}", id);
        return resultMapper.toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public void delete(UUID id) {
        if (!resultRepository.existsById(id))
            throw new ResourceNotFoundException("Result", "id", id);
        resultRepository.deleteById(id);
        log.info("Result deleted: {}", id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Result getOrThrow(UUID id) {
        return resultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Result", "id", id));
    }

    private void resolveRelations(Result result, ResultRequest request, Athlete athlete) {
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition", "id", request.getCompetitionId()));
        result.setCompetition(competition);

        CompetitionEvent event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionEvent", "id", request.getEventId()));
        result.setEvent(event);

        result.setAthlete(athlete);
    }

    private Athlete resolveAthleteFromAthleteOrUserId(UUID athleteOrUserId) {
        return athleteRepository.findById(athleteOrUserId)
            .orElseGet(() -> {
                User user = userRepository.findById(athleteOrUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Athlete", "id", athleteOrUserId));

                if (user.getRole() != UserRole.ROLE_ATHLETE) {
                    throw new ResourceNotFoundException("Athlete", "id", athleteOrUserId);
                }

                List<Athlete> existingAthletes = athleteRepository.findAllByUserIdOrderByCreatedAtDesc(athleteOrUserId);
                if (!existingAthletes.isEmpty()) {
                    if (existingAthletes.size() > 1) {
                        log.warn("Multiple athlete profiles ({}) found for user {}, using most recent {}",
                                existingAthletes.size(), athleteOrUserId, existingAthletes.get(0).getId());
                    }
                    return existingAthletes.get(0);
                }

                return createAthleteFromUser(user);
            });
    }

    private Athlete createAthleteFromUser(User user) {
        Athlete athlete = Athlete.builder()
                .user(user)
                .licenseNumber(generateAutoLicenseNumber(user.getId()))
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dateOfBirth(LocalDate.now().minusYears(18))
                .gender(com.federation.common.util.Gender.OTHER)
                .nationality("Tunisian")
                .countryCode("TUN")
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(com.federation.athletes.entity.AthleteStatus.ACTIVE)
                .build();

        Athlete saved = athleteRepository.save(athlete);
        log.info("Athlete profile auto-created {} for user {}", saved.getId(), user.getId());
        return saved;
    }

    private String generateAutoLicenseNumber(UUID userId) {
        String base = "AUTO-" + userId.toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        String candidate = base;
        int suffix = 1;
        while (athleteRepository.existsByLicenseNumber(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private void enrichWithRanking(ResultResponse resp, Result result) {
        rankingRepository
                .findByEventIdAndRoundOrderByRankPositionAsc(result.getEvent().getId(), result.getRound())
                .stream()
                .filter(rk -> rk.getResult().getId().equals(result.getId()))
                .findFirst()
                .ifPresent(rk -> {
                    resp.setRankPosition(rk.getRankPosition());
                    if (rk.getMedal() != null) resp.setMedal(rk.getMedal().name());
                });
    }

    private String normalizeStatus(String value) {
        if (value == null || value.isBlank()) return null;
        return value.toUpperCase();
    }

    private String normalizeRound(String value) {
        if (value == null || value.isBlank()) {
            return "FINAL";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizePersistedStatus(String value) {
        String normalized = normalizeStatus(value);
        if (normalized == null) {
            return "UNOFFICIAL";
        }
        return switch (normalized) {
            case "OFFICIAL", "UNOFFICIAL" -> normalized;
            default -> "UNOFFICIAL";
        };
    }

    private void ensureUniqueResult(UUID athleteId, UUID eventId, String round, UUID existingId) {
        boolean exists = existingId == null
                ? resultRepository.existsByAthleteIdAndEventIdAndRound(athleteId, eventId, round)
                : resultRepository.existsByAthleteIdAndEventIdAndRoundAndIdNot(athleteId, eventId, round, existingId);

        if (exists) {
            throw new ResourceAlreadyExistsException(
                    "A result already exists for this athlete, event, and round ('" + round + "').");
        }
    }
}
