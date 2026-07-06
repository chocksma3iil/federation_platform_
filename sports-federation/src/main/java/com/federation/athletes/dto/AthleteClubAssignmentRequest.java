package com.federation.athletes.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AthleteClubAssignmentRequest {

    @NotNull(message = "Club ID is required")
    private UUID clubId;
}
