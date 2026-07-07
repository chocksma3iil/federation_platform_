package com.federation.athletes.service;

import com.federation.athletes.entity.Athlete;
import com.federation.athletes.entity.AthleteStatus;
import com.federation.athletes.repository.AthleteRepository;
import com.federation.common.exception.ResourceNotFoundException;
import com.federation.common.util.Gender;
import com.federation.users.entity.User;
import com.federation.users.entity.UserRole;
import com.federation.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AthleteProfileProvisioningService {

    private final AthleteRepository athleteRepository;
    private final UserRepository userRepository;

    @Transactional
    public Athlete ensureAthleteProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return ensureAthleteProfile(user);
    }

    @Transactional
    public Athlete ensureAthleteProfile(UUID userId, Gender preferredGender) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return ensureAthleteProfile(user, preferredGender);
    }

    @Transactional
    public Athlete ensureAthleteProfile(User user) {
        return ensureAthleteProfile(user, null);
    }

    @Transactional
    public Athlete ensureAthleteProfile(User user, Gender preferredGender) {
        List<Athlete> existingAthletes = athleteRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        if (!existingAthletes.isEmpty()) {
            Athlete athlete = existingAthletes.get(0);
            athlete.setFirstName(user.getFirstName());
            athlete.setLastName(user.getLastName());
            athlete.setEmail(user.getEmail());
            athlete.setPhone(user.getPhone());
            if (preferredGender != null) {
                athlete.setGender(preferredGender);
            }
            return athleteRepository.save(athlete);
        }

        if (user.getRole() != UserRole.ROLE_ATHLETE) {
            throw new ResourceNotFoundException("Athlete", "userId", user.getId());
        }

        Athlete athlete = Athlete.builder()
                .user(user)
                .licenseNumber(generateAutoLicenseNumber(user.getId()))
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dateOfBirth(LocalDate.now().minusYears(18))
            .gender(preferredGender != null ? preferredGender : Gender.OTHER)
                .nationality("Tunisian")
                .countryCode("TUN")
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(AthleteStatus.ACTIVE)
                .build();

        Athlete saved = athleteRepository.save(athlete);
        log.info("Athlete profile auto-created {} for user {}", saved.getId(), user.getId());
        return saved;
    }

    @Transactional
    public void ensureProfilesForAllAthleteUsers() {
        List<User> athleteUsers = userRepository.findAllByRole(UserRole.ROLE_ATHLETE);
        athleteUsers.forEach(this::ensureAthleteProfile);
    }

    private String generateAutoLicenseNumber(UUID userId) {
        String base = "AUTO-" + userId.toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        String candidate = base;
        int suffix = 1;
        while (athleteRepository.existsByLicenseNumber(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }
}