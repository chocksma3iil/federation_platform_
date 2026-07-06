package com.federation.athletes.repository;

import com.federation.athletes.entity.Athlete;
import com.federation.athletes.entity.AthleteCategory;
import com.federation.athletes.entity.AthleteStatus;
import com.federation.common.util.Gender;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
@Repository
public interface AthleteRepository extends JpaRepository<Athlete, UUID> {

    Optional<Athlete> findByLicenseNumber(String licenseNumber);
    List<Athlete> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Athlete> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Athlete> findAllByClubIdOrderByLastNameAsc(UUID clubId);

        @Query("""
            select distinct a
            from Athlete a
            left join fetch a.user u
            left join fetch a.club c
            order by a.lastName asc, a.firstName asc
            """)
        List<Athlete> findAllWithUserAndClub();

        @Query("""
            select distinct a
            from Athlete a
            left join fetch a.user u
            left join fetch a.club c
            where c.id = :clubId
            order by a.lastName asc, a.firstName asc
            """)
        List<Athlete> findAllByClubIdWithUserAndClub(@Param("clubId") UUID clubId);

    boolean existsByLicenseNumber(String licenseNumber);
    long countByClubIdAndStatus(UUID clubId, AthleteStatus status);
}