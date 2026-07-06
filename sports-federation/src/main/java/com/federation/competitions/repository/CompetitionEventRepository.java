package com.federation.competitions.repository;

import com.federation.competitions.entity.CompetitionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompetitionEventRepository extends JpaRepository<CompetitionEvent, UUID> {

    List<CompetitionEvent> findByCompetitionIdOrderByScheduledAtAsc(UUID competitionId);

    @Query("""
            SELECT e
            FROM CompetitionEvent e
            JOIN FETCH e.competition c
            WHERE c.id = :competitionId
            ORDER BY e.scheduledAt ASC
            """)
    List<CompetitionEvent> findDetailedByCompetitionId(@Param("competitionId") UUID competitionId);

    @Query("""
            SELECT e
            FROM CompetitionEvent e
            JOIN FETCH e.competition c
            ORDER BY e.scheduledAt ASC
            """)
    List<CompetitionEvent> findAllDetailed();

    long countByCompetitionId(UUID competitionId);
}
