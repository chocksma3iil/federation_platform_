package com.federation.competitions.controller;

import com.federation.common.response.ApiResponse;
import com.federation.competitions.entity.CompetitionEvent;
import com.federation.competitions.repository.CompetitionEventRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Competition Events", description = "Competition event lookup endpoints")
@RestController
@RequestMapping("/competition-events")
@RequiredArgsConstructor
public class CompetitionEventController {

    private final CompetitionEventRepository eventRepository;

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
        List<EventItem> items = events.stream().map(e -> new EventItem(
                e.getId(),
                e.getName(),
                e.getCode(),
                e.getDiscipline(),
                e.getCompetition().getId(),
                e.getCompetition().getName()
        )).toList();
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    public record EventItem(
            UUID id,
            String name,
            String code,
            String discipline,
            UUID competitionId,
            String competitionName
    ) {}
}
