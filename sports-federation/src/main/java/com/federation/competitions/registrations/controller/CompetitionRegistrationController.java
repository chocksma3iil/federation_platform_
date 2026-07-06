package com.federation.competitions.registrations.controller;

import com.federation.auth.security.FederationUserDetails;
import com.federation.common.response.ApiResponse;
import com.federation.common.response.PagedResponse;
import com.federation.competitions.registrations.dto.CompetitionRegistrationAdminRequest;
import com.federation.competitions.registrations.dto.CompetitionRegistrationRequest;
import com.federation.competitions.registrations.dto.CompetitionRegistrationResponse;
import com.federation.competitions.registrations.dto.RegistrationStatusUpdateRequest;
import com.federation.competitions.registrations.entity.RegistrationStatus;
import com.federation.competitions.registrations.service.CompetitionRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/registrations")
@RequiredArgsConstructor
public class CompetitionRegistrationController {

    private final CompetitionRegistrationService registrationService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PagedResponse<CompetitionRegistrationResponse>>> getMyRegistrations(
            @AuthenticationPrincipal FederationUserDetails principal,
            @RequestParam(required = false) RegistrationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                registrationService.getMyRegistrations(principal.getId(), status, page, size)));
    }

    @PostMapping("/me")
    @PreAuthorize("hasAuthority(T(com.federation.users.entity.UserRole).ATHLETE)")
    public ResponseEntity<ApiResponse<CompetitionRegistrationResponse>> createMyRegistration(
            @AuthenticationPrincipal FederationUserDetails principal,
            @Valid @RequestBody CompetitionRegistrationRequest request) {

        CompetitionRegistrationResponse created = registrationService.createForCurrentAthlete(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    @PatchMapping("/me/{registrationId}/cancel")
    @PreAuthorize("hasAuthority(T(com.federation.users.entity.UserRole).ATHLETE)")
    public ResponseEntity<ApiResponse<CompetitionRegistrationResponse>> cancelMyRegistration(
            @AuthenticationPrincipal FederationUserDetails principal,
            @PathVariable UUID registrationId,
            @RequestParam(required = false) String reason) {

        CompetitionRegistrationResponse cancelled =
                registrationService.cancelMyRegistration(principal.getId(), registrationId, reason);
        return ResponseEntity.ok(ApiResponse.ok(cancelled, "Registration cancelled"));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority(T(com.federation.users.entity.UserRole).ADMIN, T(com.federation.users.entity.UserRole).FEDERATION_STAFF)")
    public ResponseEntity<ApiResponse<PagedResponse<CompetitionRegistrationResponse>>> listRegistrations(
            @RequestParam(required = false) UUID competitionId,
            @RequestParam(required = false) RegistrationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.ok(
                registrationService.adminList(competitionId, status, page, size)));
    }

        @PostMapping
        @PreAuthorize("hasAnyAuthority(T(com.federation.users.entity.UserRole).ADMIN, T(com.federation.users.entity.UserRole).FEDERATION_STAFF)")
        public ResponseEntity<ApiResponse<CompetitionRegistrationResponse>> createForStaff(
                        @AuthenticationPrincipal FederationUserDetails principal,
                        @Valid @RequestBody CompetitionRegistrationAdminRequest request) {

                CompetitionRegistrationResponse created = registrationService.createForStaff(principal.getId(), request);
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
        }

    @PatchMapping("/{registrationId}/status")
    @PreAuthorize("hasAnyAuthority(T(com.federation.users.entity.UserRole).ADMIN, T(com.federation.users.entity.UserRole).FEDERATION_STAFF)")
    public ResponseEntity<ApiResponse<CompetitionRegistrationResponse>> updateStatus(
            @PathVariable UUID registrationId,
            @Valid @RequestBody RegistrationStatusUpdateRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(
                registrationService.updateStatus(registrationId, request),
                "Registration status updated"));
    }
}
