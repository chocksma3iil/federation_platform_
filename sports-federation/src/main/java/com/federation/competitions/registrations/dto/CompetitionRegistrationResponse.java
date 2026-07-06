package com.federation.competitions.registrations.dto;

import com.federation.competitions.registrations.entity.RegistrationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompetitionRegistrationResponse {
    private UUID id;
    private UUID competitionId;
    private String competitionName;
    private UUID eventId;
    private String eventName;
    private UUID athleteId;
    private UUID athleteUserId;
    private String athleteName;
    private UUID clubId;
    private String clubName;
    private String registrationNumber;
    private Integer bibNumber;
    private BigDecimal seedValue;
    private String seedUnit;
    private RegistrationStatus status;
    private Instant confirmedAt;
    private Instant cancelledAt;
    private BigDecimal feeAmount;
    private String feeCurrency;
    private boolean feePaid;
    private boolean medicalWaiver;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
