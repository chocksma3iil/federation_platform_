package com.federation.competitions.registrations.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompetitionRegistrationAdminRequest {

    @NotNull(message = "Competition ID is required")
    private UUID competitionId;

    @NotNull(message = "Event ID is required")
    private UUID eventId;

    private UUID athleteId;
    private UUID athleteUserId;

    private BigDecimal seedValue;
    private String seedUnit;
    private boolean medicalWaiver;
    private String notes;
}
