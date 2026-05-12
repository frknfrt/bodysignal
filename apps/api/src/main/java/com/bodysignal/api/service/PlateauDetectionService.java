package com.bodysignal.api.service;

import com.bodysignal.api.domain.AIAnalysis;
import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.Exercise;
import com.bodysignal.api.domain.User;
import com.bodysignal.api.dto.PlateauStatus;
import com.bodysignal.api.repository.AIAnalysisRepository;
import com.bodysignal.api.repository.DailyRecordRepository;
import com.bodysignal.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PlateauDetectionService {

    private final DailyRecordRepository dailyRecordRepository;
    private final AIAnalysisRepository  aiAnalysisRepository;
    private final UserRepository        userRepository;

    public PlateauStatus detect(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return none();

        List<DailyRecord> all = dailyRecordRepository.findByUserId(user.getId());
        if (all.size() < 2) return none();

        // Tarihe göre eskiden yeniye sırala
        all.sort(Comparator.comparing(r -> r.getRecordDate() != null ? r.getRecordDate() : ""));

        LocalDate today      = LocalDate.now();
        String twoWeeksAgo   = today.minusDays(14).toString();
        String fourWeeksAgo  = today.minusDays(28).toString();

        List<DailyRecord> last2Weeks  = all.stream()
                .filter(r -> r.getRecordDate() != null && r.getRecordDate().compareTo(twoWeeksAgo) >= 0)
                .toList();
        List<DailyRecord> prior2Weeks = all.stream()
                .filter(r -> r.getRecordDate() != null
                        && r.getRecordDate().compareTo(fourWeeksAgo) >= 0
                        && r.getRecordDate().compareTo(twoWeeksAgo) < 0)
                .toList();

        // 1. Performans Plateausu
        PlateauStatus perf = checkPerformance(last2Weeks);
        if (perf != null) return perf;

        // 2. Toparlanma Plateausu
        List<AIAnalysis> recent3 = aiAnalysisRepository.findTop3ByUserEmailOrderByCreatedAtDesc(email);
        PlateauStatus recovery = checkRecovery(recent3);
        if (recovery != null) return recovery;

        // 3. Motivasyon Plateausu
        PlateauStatus motivation = checkMotivation(last2Weeks, prior2Weeks);
        if (motivation != null) return motivation;

        return none();
    }

    // ─── 1. Performans ───────────────────────────────────────────────────────

    private PlateauStatus checkPerformance(List<DailyRecord> records) {
        if (records.size() < 2) return null;

        // Egzersiz adına göre kronolojik liste (eskiden yeniye) oluştur
        Map<String, List<Exercise>> byName = new LinkedHashMap<>();
        for (DailyRecord rec : records) {
            if (rec.getWorkout() == null || rec.getWorkout().getExercises() == null) continue;
            for (Exercise e : rec.getWorkout().getExercises()) {
                if (e.getName() == null) continue;
                String key = e.getName().toLowerCase().trim();
                byName.computeIfAbsent(key, k -> new ArrayList<>()).add(e);
            }
        }

        int stagnantCount         = 0;
        int rpeRisingWeightSameCount = 0;
        String firstStagnant      = null;

        for (Map.Entry<String, List<Exercise>> entry : byName.entrySet()) {
            List<Exercise> list = entry.getValue();
            if (list.size() < 2) continue;

            Exercise oldest = list.get(0);
            Exercise newest = list.get(list.size() - 1);

            double oldWeight = oldest.getWeight()   != null ? oldest.getWeight()   : 0;
            double newWeight = newest.getWeight()   != null ? newest.getWeight()   : 0;
            int    oldReps   = oldest.getRepCount() != null ? oldest.getRepCount() : 0;
            int    newReps   = newest.getRepCount() != null ? newest.getRepCount() : 0;
            int    oldRpe    = oldest.getLastSetRpe() != null ? oldest.getLastSetRpe() : 0;
            int    newRpe    = newest.getLastSetRpe() != null ? newest.getLastSetRpe() : 0;

            boolean weightStagnant = (newWeight - oldWeight) < 0.5;
            boolean repsStagnant   = (newReps - oldReps) < 1;

            if (weightStagnant && repsStagnant) {
                stagnantCount++;
                if (firstStagnant == null) firstStagnant = entry.getKey();
            }

            // RPE artıyor ama ağırlık artmıyor
            if (newRpe > oldRpe + 1 && weightStagnant) {
                rpeRisingWeightSameCount++;
            }
        }

        if (rpeRisingWeightSameCount > 0 && stagnantCount > 0) {
            return build("PERFORMANCE", "HIGH",
                    String.format(
                            "%d egzersizde ağırlık artmıyor ancak RPE yükseliyor — aşırı antrenman riski var, deload düşün.",
                            rpeRisingWeightSameCount));
        }
        if (rpeRisingWeightSameCount > 0) {
            return build("PERFORMANCE", "MEDIUM",
                    String.format(
                            "%d egzersizde yoğunluk artıyor ama ağırlık ilerlemiyor — yüklenme stratejini gözden geçir.",
                            rpeRisingWeightSameCount));
        }
        if (stagnantCount >= 2) {
            return build("PERFORMANCE", "MEDIUM",
                    String.format(
                            "Son 2 haftada %d egzersizde ne ağırlık ne de tekrar sayısı artmadı.",
                            stagnantCount));
        }
        if (stagnantCount == 1 && firstStagnant != null) {
            return build("PERFORMANCE", "LOW",
                    String.format(
                            "'%s' egzersizinde son 2 haftada ilerleme gözlemlenmiyor.",
                            capitalize(firstStagnant)));
        }
        return null;
    }

    // ─── 2. Toparlanma ───────────────────────────────────────────────────────

    private PlateauStatus checkRecovery(List<AIAnalysis> recent3) {
        List<Double> scores = recent3.stream()
                .filter(a -> a.getRecoveryScore() != null)
                .map(AIAnalysis::getRecoveryScore)
                .toList();
        if (scores.size() < 3) return null;

        double max = scores.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double min = scores.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double avg = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        boolean allIn6070  = scores.stream().allMatch(s -> s >= 60 && s <= 70);
        boolean in5Percent = avg > 0 && (max - min) / avg < 0.05;

        if (allIn6070 && in5Percent) {
            return build("RECOVERY", "MEDIUM",
                    String.format(
                            "Son 3 analizde toparlanma skoru %.0f–%.0f bandında takılı — uyku düzeni veya beslenme rutinini değiştir.",
                            min, max));
        }
        if (in5Percent) {
            return build("RECOVERY", "LOW",
                    String.format(
                            "Son 3 analizde toparlanma skoru %.1f puanlık dar bir bantta seyrediyor.",
                            max - min));
        }
        if (allIn6070) {
            return build("RECOVERY", "LOW",
                    "Toparlanma skoru sürekli 60–70 arasında — orta düzey toparlanma platosu oluştu.");
        }
        return null;
    }

    // ─── 3. Motivasyon ───────────────────────────────────────────────────────

    private PlateauStatus checkMotivation(List<DailyRecord> last2Weeks, List<DailyRecord> prior2Weeks) {
        int recent = last2Weeks.size();
        int prior  = prior2Weeks.size();
        if (prior == 0) return null;

        if (recent == 0) {
            return build("MOTIVATION", "HIGH",
                    "Son 2 haftada hiç sinyal girilmedi — takip rutini tamamen durmuş.");
        }
        if (recent * 2 <= prior) {
            return build("MOTIVATION", "MEDIUM",
                    String.format(
                            "Sinyal girişi önceki 2 haftaya göre yarıya düştü (%d → %d kayıt) — motivasyonu yeniden kazanmaya odaklan.",
                            prior, recent));
        }
        return null;
    }

    // ─── Yardımcılar ─────────────────────────────────────────────────────────

    private PlateauStatus build(String type, String severity, String reason) {
        PlateauStatus s = new PlateauStatus();
        s.setPlateauType(type);
        s.setSeverity(severity);
        s.setReason(reason);
        s.setDetectedAt(LocalDateTime.now());
        return s;
    }

    private PlateauStatus none() {
        PlateauStatus s = new PlateauStatus();
        s.setPlateauType("NONE");
        s.setSeverity("LOW");
        s.setReason("Belirgin bir plato tespit edilmedi.");
        s.setDetectedAt(LocalDateTime.now());
        return s;
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
