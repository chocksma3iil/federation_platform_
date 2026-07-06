package com.federation.competitions.registrations.repository;

import com.federation.competitions.registrations.entity.CompetitionRegistration;
import com.federation.competitions.registrations.entity.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionRegistrationRepository extends JpaRepository<CompetitionRegistration, UUID> {

    boolean existsByAthleteIdAndEventId(UUID athleteId, UUID eventId);

    @Query("""
            SELECT cr FROM CompetitionRegistration cr
            WHERE cr.athlete.user.id = :userId
            ORDER BY cr.createdAt DESC
            """)
    Page<CompetitionRegistration> findByAthleteUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
            SELECT cr FROM CompetitionRegistration cr
            WHERE cr.athlete.user.id = :userId
              AND cr.status = :status
            ORDER BY cr.createdAt DESC
            """)
    Page<CompetitionRegistration> findByAthleteUserIdAndStatus(@Param("userId") UUID userId,
                                                                @Param("status") RegistrationStatus status,
                                                                Pageable pageable);

    @Query("""
            SELECT cr FROM CompetitionRegistration cr
            WHERE cr.id = :registrationId
              AND cr.athlete.user.id = :userId
            """)
    Optional<CompetitionRegistration> findByIdAndAthleteUserId(@Param("registrationId") UUID registrationId,
                                                                @Param("userId") UUID userId);

    Page<CompetitionRegistration> findByCompetitionId(UUID competitionId, Pageable pageable);

        Page<CompetitionRegistration> findByStatus(RegistrationStatus status, Pageable pageable);

    Page<CompetitionRegistration> findByCompetitionIdAndStatus(UUID competitionId, RegistrationStatus status, Pageable pageable);
}
