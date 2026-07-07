package com.federation.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Reset password request")
public class ResetPasswordRequest {

    @NotBlank
    @Schema(description = "Password reset token")
    private String token;

    @NotBlank
    @Size(min = 8)
    @Schema(description = "New password", minLength = 8)
    private String newPassword;

    @NotBlank
    @Schema(description = "New password confirmation")
    private String confirmPassword;
}
