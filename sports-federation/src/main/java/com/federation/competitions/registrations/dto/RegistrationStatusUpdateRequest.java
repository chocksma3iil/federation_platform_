package com.federation.competitions.registrations.dto;

import com.federation.competitions.registrations.entity.RegistrationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private RegistrationStatus status;

    private String cancellationReason;
}
