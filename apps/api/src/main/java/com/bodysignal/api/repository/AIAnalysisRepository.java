package com.bodysignal.api.repository;

import com.bodysignal.api.domain.AIAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AIAnalysisRepository
        extends JpaRepository<AIAnalysis, Long> {

    Optional<AIAnalysis> findByDailyRecordId(Long id);
    Optional<AIAnalysis> findByDailyRecordIdAndUserEmail(
            Long id,
            String email
    );
    Optional<AIAnalysis> findTopByUserEmailOrderByCreatedAtDesc(String email);
    List<AIAnalysis> findTop3ByUserEmailOrderByCreatedAtDesc(String email);
    List<AIAnalysis> findAllByUserEmailOrderByCreatedAtDesc(String email);
    void deleteAllByUserEmail(String email);

    Optional<AIAnalysis> findTopByUserEmailAndCreatedAtBetweenOrderByCreatedAtDesc(
            String email, LocalDateTime start, LocalDateTime end);
}