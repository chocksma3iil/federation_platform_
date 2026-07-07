package com.federation.auth.service;

import com.federation.auth.dto.*;
import com.federation.auth.entity.RefreshToken;
import com.federation.auth.mapper.AuthMapper;
import com.federation.auth.repository.RefreshTokenRepository;
import com.federation.auth.security.FederationUserDetails;
import com.federation.common.config.JwtProperties;
import com.federation.common.exception.BadRequestException;
import com.federation.common.exception.ResourceAlreadyExistsException;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.exception.UnauthorizedException;
import com.federation.common.util.JwtTokenUtil;
import com.federation.users.entity.User;
import com.federation.users.entity.UserRole;
import com.federation.users.entity.UserStatus;
import com.federation.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Core authentication service.
 *
 * Responsibilities:
 *  - User registration (defaults to ROLE_PUBLIC)
 *  - Login with email-or-username, returns JWT pair
 *  - Token refresh with rotation (old refresh token revoked, new pair issued)
 *  - Logout (revoke all tokens for the user)
 *  - Change password (re-verifies current password before update)
 *  - /me profile read
 *
 * All token issuance goes through {@link #issueTokenPair(User)} to enforce
 * a single, audited code path.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtTokenUtil           jwtTokenUtil;
    private final JwtProperties          jwtProperties;
    private final AuthenticationManager  authManager;
    private final UserDetailsService     userDetailsService;
    private final AuthMapper             authMapper;
    private final JavaMailSender         mailSender;

    @Value("${app.password-reset.base-url:http://localhost:4200/auth/reset-password}")
    private String passwordResetBaseUrl;

    @Value("${app.mail.from:no-reply@sports-federation.local}")
    private String mailFrom;

    // ----------------------------------------------------------------
    // Registration
    // ----------------------------------------------------------------

    /**
     * Creates a new account with role PUBLIC, status ACTIVE.
     * Immediately returns a token pair so the user is logged in after signup.
     *
     * @throws ResourceAlreadyExistsException if email or username is taken
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validateUniqueFields(request.getEmail(), request.getUsername());

        User user = User.builder()
                .email(request.getEmail().toLowerCase().strip())
                .username(request.getUsername().strip())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().strip())
                .lastName(request.getLastName().strip())
                .role(UserRole.ROLE_PUBLIC)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("Registered new user id={} email={}", user.getId(), user.getEmail());

        return issueTokenPair(user);
    }

    // ----------------------------------------------------------------
    // Login
    // ----------------------------------------------------------------

    /**
     * Authenticates with email-or-username + password.
     * Updates last_login timestamp on success.
     *
     * @throws UnauthorizedException  on bad credentials or disabled/locked account
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsernameOrEmail(),
                            request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Invalid email/username or password.");
        } catch (DisabledException e) {
            throw new UnauthorizedException("Your account is disabled. Contact support.");
        } catch (LockedException e) {
            throw new UnauthorizedException("Your account is suspended. Contact support.");
        } catch (AuthenticationException e) {
            throw new UnauthorizedException("Authentication failed: " + e.getMessage());
        }

        User user = userRepository
                .findByEmailOrUsername(request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("User not found."));

        userRepository.updateLastLogin(user.getId(), Instant.now());
        log.info("Login success id={} email={}", user.getId(), user.getEmail());

        return issueTokenPair(user);
    }

    // ----------------------------------------------------------------
    // Token refresh
    // ----------------------------------------------------------------

    /**
     * Exchanges a valid refresh token for a new access+refresh pair.
     * The old refresh token is revoked immediately (rotation strategy —
     * prevents replay after theft).
     *
     * @throws UnauthorizedException if the token is unknown, expired or revoked
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token not recognised."));

        if (stored.isRevoked()) {
            // Token reuse detected — revoke all tokens for the user (security response)
            log.warn("Refresh token reuse detected for user {}", stored.getUser().getId());
            refreshTokenRepository.revokeAllUserTokens(stored.getUser().getId());
            throw new UnauthorizedException(
                    "Refresh token has already been used. All sessions revoked. Please log in again.");
        }

        if (stored.isExpired()) {
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        // Rotate: mark old as revoked
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        log.info("Token refreshed id={} email={}", user.getId(), user.getEmail());
        return issueTokenPair(user);
    }

    // ----------------------------------------------------------------
    // Logout
    // ----------------------------------------------------------------

    /**
     * Revokes all refresh tokens for the principal.
     * Existing access tokens remain valid until they expire naturally
     * (stateless design — keep expiry short, e.g. 15–60 minutes in production).
     */
    @Transactional
    public void logout(UUID userId) {
        int revoked = refreshTokenRepository.revokeAllUserTokens(userId);
        log.info("Logout: revoked {} token(s) for userId={}", revoked, userId);
    }

    // ----------------------------------------------------------------
    // Change password
    // ----------------------------------------------------------------

    /**
     * Verifies the current password before applying the new one.
     * Revokes all refresh tokens (forces re-login on other devices).
     */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        userRepository.updatePassword(userId, passwordEncoder.encode(request.getNewPassword()));
        refreshTokenRepository.revokeAllUserTokens(userId);
        log.info("Password changed for userId={} — all sessions revoked", userId);
    }

    // ----------------------------------------------------------------
    // Forgot/reset password
    // ----------------------------------------------------------------

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().strip();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // Intentionally silent to avoid account enumeration.
            return;
        }

        User user = userOpt.get();
        String token = jwtTokenUtil.generatePasswordResetToken(user.getEmail());
        String resetLink = passwordResetBaseUrl + "?token=" + token;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Reset your Sports Federation password");
            message.setText(buildPasswordResetEmailBody(resetLink));
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (MailException ex) {
            // Keep API response generic while surfacing operational issue in logs.
            log.error("Failed to send password reset email to {}", user.getEmail(), ex);
            log.info("Password reset fallback link for {}: {}", user.getEmail(), resetLink);
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match.");
        }

        String token = request.getToken();
        if (!jwtTokenUtil.validateToken(token) || !jwtTokenUtil.isPasswordResetToken(token)) {
            throw new UnauthorizedException("Invalid or expired reset token.");
        }

        String email = jwtTokenUtil.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        userRepository.updatePassword(user.getId(), passwordEncoder.encode(request.getNewPassword()));
        refreshTokenRepository.revokeAllUserTokens(user.getId());
        log.info("Password reset completed for userId={} email={}", user.getId(), user.getEmail());
    }

    private String buildPasswordResetEmailBody(String resetLink) {
        return "We received a request to reset your password.\n\n"
                + "Use the link below to choose a new password:\n"
                + resetLink
                + "\n\n"
                + "If you did not request this, you can safely ignore this email.";
    }

    // ----------------------------------------------------------------
    // Profile read
    // ----------------------------------------------------------------

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return authMapper.toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(normalizeOptional(request.getPhone()));
        user.setAvatarUrl(normalizeOptional(request.getAvatarUrl()));

        User saved = userRepository.save(user);
        log.info("Profile updated for userId={}", userId);
        return authMapper.toProfileResponse(saved);
    }

    // ----------------------------------------------------------------
    // Helper used by the controller to resolve principal UUID
    // ----------------------------------------------------------------

    @Transactional(readOnly = true)
    public UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email))
                .getId();
    }

    // ----------------------------------------------------------------
    // Private — token issuance
    // ----------------------------------------------------------------

    private AuthResponse issueTokenPair(User user) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());

        String accessToken  = jwtTokenUtil.generateAccessToken(details);
        String refreshToken = jwtTokenUtil.generateRefreshToken(details);

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .user(user)
                        .token(refreshToken)
                        .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                        .build()
        );

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtProperties.getExpirationMs() / 1000,
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole()
        );
    }

    // ----------------------------------------------------------------
    // Private — validation helpers
    // ----------------------------------------------------------------

    private void validateUniqueFields(String email, String username) {
        if (userRepository.existsByEmail(email.toLowerCase().strip())) {
            throw new ResourceAlreadyExistsException(
                    "An account with email '" + email + "' already exists.");
        }
        if (userRepository.existsByUsername(username.strip())) {
            throw new ResourceAlreadyExistsException(
                    "Username '" + username + "' is already taken.");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
