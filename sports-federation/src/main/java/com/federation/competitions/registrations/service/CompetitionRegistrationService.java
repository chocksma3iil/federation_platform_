package com.federation.competitions.registrations.service;

import com.federation.athletes.entity.Athlete;
import com.federation.athletes.repository.AthleteRepository;
import com.federation.athletes.service.AthleteProfileProvisioningService;
import com.federation.common.exception.BadRequestException;
import com.federation.common.exception.BusinessRuleViolationException;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.response.PagedResponse;
import com.federation.competitions.entity.Competition;
import com.federation.competitions.entity.CompetitionEvent;
import com.federation.competitions.entity.CompetitionStatus;
import com.federation.competitions.registrations.dto.CompetitionRegistrationAdminRequest;
import com.federation.competitions.registrations.dto.CompetitionRegistrationRequest;
import com.federation.competitions.registrations.dto.CompetitionRegistrationResponse;
import com.federation.competitions.registrations.dto.RegistrationStatusUpdateRequest;
import com.federation.competitions.registrations.entity.CompetitionRegistration;
import com.federation.competitions.registrations.entity.RegistrationStatus;
import com.federation.competitions.registrations.repository.CompetitionRegistrationRepository;
import com.federation.competitions.repository.CompetitionEventRepository;
import com.federation.competitions.repository.CompetitionRepository;
import com.federation.users.entity.User;
import com.federation.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompetitionRegistrationService {

    private final CompetitionRegistrationRepository registrationRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionEventRepository eventRepository;
    private final AthleteRepository athleteRepository;
    private final UserRepository userRepository;
    private final AthleteProfileProvisioningService athleteProfileProvisioningService;

    @Transactional
    public CompetitionRegistrationResponse createForCurrentAthlete(UUID currentUserId, CompetitionRegistrationRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Athlete athlete = resolveAthleteByUserId(currentUserId);
        return createRegistrationInternal(athlete, currentUser, request);
    }

    @Transactional
    public CompetitionRegistrationResponse createForStaff(UUID currentUserId, CompetitionRegistrationAdminRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Athlete athlete = resolveAthleteForAdminRequest(request);

        CompetitionRegistrationRequest mapped = CompetitionRegistrationRequest.builder()
                .competitionId(request.getCompetitionId())
                .eventId(request.getEventId())
                .seedValue(request.getSeedValue())
                .seedUnit(request.getSeedUnit())
                .medicalWaiver(request.isMedicalWaiver())
                .notes(request.getNotes())
                .build();

        return createRegistrationInternal(athlete, currentUser, mapped);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CompetitionRegistrationResponse> getMyRegistrations(UUID currentUserId,
                                                                             RegistrationStatus status,
                                                                             int page,
                                                                             int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<CompetitionRegistration> registrations = (status == null)
                ? registrationRepository.findByAthleteUserId(currentUserId, pageable)
                : registrationRepository.findByAthleteUserIdAndStatus(currentUserId, status, pageable);

        List<CompetitionRegistrationResponse> mapped = registrations.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PagedResponse.of(registrations, mapped);
    }

    @Transactional
    public CompetitionRegistrationResponse cancelMyRegistration(UUID currentUserId, UUID registrationId, String reason) {
        CompetitionRegistration registration = registrationRepository.findByIdAndAthleteUserId(registrationId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", registrationId));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return toResponse(registration);
        }

        if (registration.getStatus() == RegistrationStatus.DISQUALIFIED) {
            throw new BusinessRuleViolationException("Disqualified registrations cannot be cancelled");
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(Instant.now());
        registration.setCancellationReason(reason);

        return toResponse(registrationRepository.save(registration));
    }

    @Transactional(readOnly = true)
    public PagedResponse<CompetitionRegistrationResponse> adminList(UUID competitionId,
                                                                    RegistrationStatus status,
                                                                    int page,
                                                                    int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<CompetitionRegistration> registrations;
        if (competitionId == null && status == null) {
            registrations = registrationRepository.findAll(pageable);
        } else if (competitionId != null && status == null) {
            registrations = registrationRepository.findByCompetitionId(competitionId, pageable);
        } else if (competitionId != null) {
            registrations = registrationRepository.findByCompetitionIdAndStatus(competitionId, status, pageable);
        } else {
            registrations = registrationRepository.findByStatus(status, pageable);
        }

        List<CompetitionRegistrationResponse> mapped = registrations.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PagedResponse.of(registrations, mapped);
    }

    @Transactional
    public CompetitionRegistrationResponse updateStatus(UUID registrationId, RegistrationStatusUpdateRequest request) {
        CompetitionRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", registrationId));

        RegistrationStatus target = request.getStatus();
        registration.setStatus(target);

        if (target == RegistrationStatus.CONFIRMED) {
            registration.setConfirmedAt(Instant.now());
            registration.setCancelledAt(null);
            registration.setCancellationReason(null);
        } else if (target == RegistrationStatus.CANCELLED) {
            registration.setCancelledAt(Instant.now());
            registration.setCancellationReason(request.getCancellationReason());
        }

        return toResponse(registrationRepository.save(registration));
    }

    private CompetitionRegistrationResponse createRegistrationInternal(Athlete athlete,
                                                                       User currentUser,
                                                                       CompetitionRegistrationRequest request) {
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition", "id", request.getCompetitionId()));

        CompetitionEvent event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition event", "id", request.getEventId()));

        validateCompetitionEventConsistency(competition, event);
        validateCompetitionOpenForRegistration(competition);
        validateAthleteIsEligibleForEvent(athlete, event);

        if (registrationRepository.existsByAthleteIdAndEventId(athlete.getId(), event.getId())) {
            throw new BusinessRuleViolationException("Athlete is already registered for this event");
        }

        CompetitionRegistration registration = CompetitionRegistration.builder()
                .competition(competition)
                .event(event)
                .athlete(athlete)
                .club(athlete.getClub())
                .registeredBy(currentUser)
                .seedValue(request.getSeedValue())
                .seedUnit(request.getSeedUnit())
                .medicalWaiver(request.isMedicalWaiver())
                .notes(request.getNotes())
                .feeAmount(competition.getEntryFee())
                .feeCurrency(competition.getCurrency() == null ? "TND" : competition.getCurrency())
                .status(RegistrationStatus.PENDING)
                .build();

        return toResponse(registrationRepository.save(registration));
    }

    private Athlete resolveAthleteByUserId(UUID userId) {
        return athleteProfileProvisioningService.ensureAthleteProfile(userId);
    }

    private Athlete resolveAthleteForAdminRequest(CompetitionRegistrationAdminRequest request) {
        if (request.getAthleteId() != null) {
            return athleteRepository.findById(request.getAthleteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Athlete", "id", request.getAthleteId()));
        }

        if (request.getAthleteUserId() != null) {
            return resolveAthleteByUserId(request.getAthleteUserId());
        }

        throw new BadRequestException("Either athleteId or athleteUserId is required");
    }

    private void validateCompetitionEventConsistency(Competition competition, CompetitionEvent event) {
        if (!event.getCompetition().getId().equals(competition.getId())) {
            throw new BadRequestException("Selected event does not belong to selected competition");
        }
    }

    private void validateCompetitionOpenForRegistration(Competition competition) {
        if (competition.getStatus() != CompetitionStatus.REGISTRATION_OPEN
                && competition.getStatus() != CompetitionStatus.PUBLISHED) {
            throw new BusinessRuleViolationException("Registration is not open for this competition");
        }
    }

    private void validateAthleteIsEligibleForEvent(Athlete athlete, CompetitionEvent event) {
        if (event.getGenderCategory() != null && athlete.getGender() != null
                && event.getGenderCategory() != athlete.getGender()) {
            throw new BusinessRuleViolationException("Athlete gender is not eligible for this event");
        }

        if (event.getAgeCategory() != null && athlete.getCategory() != null
                && event.getAgeCategory() != athlete.getCategory()) {
            throw new BusinessRuleViolationException("Athlete category is not eligible for this event");
        }
    }

    private CompetitionRegistrationResponse toResponse(CompetitionRegistration registration) {
        Athlete athlete = registration.getAthlete();
        String athleteName = String.format("%s %s",
                athlete.getFirstName() == null ? "" : athlete.getFirstName(),
                athlete.getLastName() == null ? "" : athlete.getLastName()).trim();

        return CompetitionRegistrationResponse.builder()
                .id(registration.getId())
                .competitionId(registration.getCompetition().getId())
                .competitionName(registration.getCompetition().getName())
                .eventId(registration.getEvent().getId())
                .eventName(registration.getEvent().getName())
                .athleteId(athlete.getId())
                .athleteUserId(athlete.getUser() != null ? athlete.getUser().getId() : null)
                .athleteName(athleteName)
                .clubId(registration.getClub() != null ? registration.getClub().getId() : null)
                .clubName(registration.getClub() != null ? registration.getClub().getName() : null)
                .registrationNumber(registration.getRegistrationNumber())
                .bibNumber(registration.getBibNumber())
                .seedValue(registration.getSeedValue())
                .seedUnit(registration.getSeedUnit())
                .status(registration.getStatus())
                .confirmedAt(registration.getConfirmedAt())
                .cancelledAt(registration.getCancelledAt())
                .feeAmount(registration.getFeeAmount())
                .feeCurrency(registration.getFeeCurrency())
                .feePaid(registration.isFeePaid())
                .medicalWaiver(registration.isMedicalWaiver())
                .notes(registration.getNotes())
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }
}
