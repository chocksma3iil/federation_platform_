package com.federation.competitions.controller;

import com.federation.athletes.entity.AthleteCategory;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.response.ApiResponse;
import com.federation.common.util.Gender;
import com.federation.competitions.entity.Competition;
import com.federation.competitions.entity.CompetitionEvent;
import com.federation.competitions.entity.CompetitionStatus;
import com.federation.competitions.repository.CompetitionEventRepository;
import com.federation.competitions.repository.CompetitionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Tag(name = "Competition Events", description = "Competition event management endpoints")
@RestController
@RequestMapping("/competition-events")
@RequiredArgsConstructor
public class CompetitionEventController {

    private final CompetitionEventRepository eventRepository;
    private final CompetitionRepository competitionRepository;

    @Operation(summary = "List all events, optionally filtered by competition")
    @GetMapping
    public ResponseEntity<ApiResponse<List<EventItem>>> findAll(
            @RequestParam(required = false) UUID competitionId) {
        List<CompetitionEvent> events;
        if (competitionId != null) {
            events = eventRepository.findDetailedByCompetitionId(competitionId);
        } else {
            events = eventRepository.findAllDetailed();
        }
        List<EventItem> items = events.stream().map(this::toItem).toList();
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @Operation(summary = "Create a new competition event")
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ResponseEntity<ApiResponse<EventItem>> create(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(createEvent(request)));
        }

        @Operation(summary = "Create a new event for a specific competition")
        @PostMapping("/competitions/{competitionId:[0-9a-fA-F-]{36}}")
        @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
        public ResponseEntity<ApiResponse<EventItem>> createForCompetition(
            @PathVariable UUID competitionId,
            @Valid @RequestBody EventRequest request) {
        request.setCompetitionId(competitionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(createEvent(request)));
    }

    @Operation(summary = "Update a competition event")
    @PutMapping("/{id:[0-9a-fA-F-]{36}}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ResponseEntity<ApiResponse<EventItem>> update(@PathVariable UUID id,
                                                          @Valid @RequestBody EventRequest request) {
        CompetitionEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionEvent", "id", id));
        if (request.getCompetitionId() != null && !request.getCompetitionId().equals(event.getCompetition().getId())) {
            Competition competition = competitionRepository.findById(request.getCompetitionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Competition", "id", request.getCompetitionId()));
            event.setCompetition(competition);
        }
        event.setName(request.getName());
        event.setCode(request.getCode());
        event.setDiscipline(request.getDiscipline());
        event.setGenderCategory(request.getGenderCategory());
        event.setAgeCategory(request.getAgeCategory());
        if (request.getScheduledAt() != null) event.setScheduledAt(request.getScheduledAt());
        if (request.getDurationMinutes() != null) event.setDurationMinutes(request.getDurationMinutes());
        if (request.getMaxParticipants() != null) event.setMaxParticipants(request.getMaxParticipants());
        CompetitionEvent saved = eventRepository.save(event);
        log.info("Competition event updated: {}", id);
        return ResponseEntity.ok(ApiResponse.ok(toItem(saved)));
    }

    @Operation(summary = "Delete a competition event")
    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_FEDERATION_STAFF')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("CompetitionEvent", "id", id);
        }
        eventRepository.deleteById(id);
        log.info("Competition event deleted: {}", id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    private EventItem toItem(CompetitionEvent e) {
        return new EventItem(
                e.getId(),
                e.getName(),
                e.getCode(),
                e.getDiscipline(),
                e.getGenderCategory(),
                e.getAgeCategory(),
                e.getCompetition().getId(),
                e.getCompetition().getName(),
                e.getScheduledAt(),
                e.getDurationMinutes(),
                e.getMaxParticipants()
        );
    }

    private EventItem createEvent(EventRequest request) {
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition", "id", request.getCompetitionId()));
        CompetitionEvent event = CompetitionEvent.builder()
                .competition(competition)
                .name(request.getName())
                .code(request.getCode())
                .discipline(request.getDiscipline())
                .genderCategory(request.getGenderCategory())
                .ageCategory(request.getAgeCategory())
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .maxParticipants(request.getMaxParticipants())
                .status(CompetitionStatus.DRAFT)
                .build();
        CompetitionEvent saved = eventRepository.save(event);
        log.info("Competition event created: {} for competition {}", saved.getName(), competition.getId());
        return toItem(saved);
    }

    public record EventItem(
            UUID id,
            String name,
            String code,
            String discipline,
            Gender genderCategory,
            AthleteCategory ageCategory,
            UUID competitionId,
            String competitionName,
            Instant scheduledAt,
            Integer durationMinutes,
            Integer maxParticipants
    ) {}

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EventRequest {
        @NotNull(message = "Competition ID is required")
        private UUID competitionId;

        @NotBlank(message = "Event name is required")
        private String name;

        private String code;

        @NotBlank(message = "Discipline is required")
        private String discipline;

        private Gender genderCategory;
        private AthleteCategory ageCategory;
        private Instant scheduledAt;
        private Integer durationMinutes;
        private Integer maxParticipants;
    }
}
