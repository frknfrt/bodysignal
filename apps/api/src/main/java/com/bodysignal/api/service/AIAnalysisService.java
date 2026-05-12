package com.bodysignal.api.service;

import com.bodysignal.api.domain.AIAnalysis;
import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.Exercise;
import com.bodysignal.api.domain.User;
import com.bodysignal.api.repository.AIAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AIAnalysisService {

    private final AIClient aiClient;
    private final AIAnalysisRepository repository;
    private final UserService userService;

    public void analyzeAndSave(DailyRecord record, String email) {
        // Cache: günde 1 analiz hakkı — bugün zaten analiz varsa API'ye gitme
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        Optional<AIAnalysis> cached = repository.findTopByUserEmailAndCreatedAtBetweenOrderByCreatedAtDesc(
                email, startOfDay, endOfDay);
        if (cached.isPresent()) return;

        double score = calculateScore(record);
        User user = userService.findByEmail(email);
        List<AIAnalysis> recentHistory = repository.findTop3ByUserEmailOrderByCreatedAtDesc(email);
        AnalysisResult result = aiClient.getAnalysis(record, score, user, recentHistory);

        AIAnalysis analysis = new AIAnalysis();
        analysis.setUserEmail(email);
        analysis.setDailyRecord(record);
        analysis.setGeneralComment(result.getGeneralComment());
        analysis.setStrengthPoint(result.getStrengthPoint());
        analysis.setImprovementPoint(result.getImprovementPoint());
        analysis.setTomorrowSuggestion(result.getTomorrowSuggestion());
        // backward-compat: analysisText = genel yorum
        analysis.setAnalysisText(result.getGeneralComment());
        analysis.setRecoveryScore(score);
        analysis.setCreatedAt(LocalDateTime.now());

        repository.save(analysis);
    }

    public AIAnalysis getByRecordId(Long recordId, String email) {
        return repository
                .findByDailyRecordIdAndUserEmail(recordId, email)
                .orElseThrow(() -> new RuntimeException("Analiz bulunamadı"));
    }

    public AIAnalysis getLatest(String email) {
        return repository
                .findTopByUserEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new RuntimeException("Henüz analiz yok"));
    }

    public List<AIAnalysis> getHistory(String email) {
        return repository.findAllByUserEmailOrderByCreatedAtDesc(email);
    }

    public int recalculateAllScores() {
        List<AIAnalysis> all = repository.findAll();
        int updated = 0;
        for (AIAnalysis a : all) {
            if (a.getDailyRecord() != null) {
                a.setRecoveryScore(calculateScore(a.getDailyRecord()));
                updated++;
            }
        }
        repository.saveAll(all);
        return updated;
    }

    /**
     * Uyku süresi (0–50 puan) + ortalama RPE (0–50 puan) → toplam 0–100
     * Uyku: 8 saat = tam puan, daha az uyku orantılı düşer
     * RPE:  6 = tam puan (düşük yorgunluk), 10 = 0 puan (maksimal stres)
     */
    private Double calculateScore(DailyRecord record) {
        double sleepScore = 0;
        try {
            LocalTime sleep = LocalTime.parse(record.getSleepTime());
            LocalTime wake  = LocalTime.parse(record.getWakeUpTime());
            long minutes = Duration.between(sleep, wake).toMinutes();
            if (minutes < 0) minutes += 24 * 60L; // gece yarısı geçişi
            double hours = minutes / 60.0;
            sleepScore = Math.min(hours / 8.0, 1.0) * 50.0;
        } catch (Exception ignored) {}

        double rpeScore = 25;
        try {
            List<Exercise> exercises = record.getWorkout().getExercises();
            if (!exercises.isEmpty()) {
                double avgRpe = exercises.stream()
                        .mapToInt(e -> e.getLastSetRpe() != null ? e.getLastSetRpe() : 8)
                        .average()
                        .orElse(8);
                // RPE 1 → 50 puan, RPE 10 → 0 puan  (1–10 skalası, aralık = 9)
                rpeScore = Math.max(0, (10.0 - avgRpe) / 9.0) * 50.0;
            }
        } catch (Exception ignored) {}

        double total = sleepScore + rpeScore;
        return Math.round(Math.min(100.0, total) * 10.0) / 10.0;
    }
}
