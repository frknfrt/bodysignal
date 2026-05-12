package com.bodysignal.api.controller;

import com.bodysignal.api.domain.AIAnalysis;
import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.Exercise;
import com.bodysignal.api.dto.AIAnalysisResponseDto;
import com.bodysignal.api.dto.PlateauStatus;
import com.bodysignal.api.service.AIAnalysisService;
import com.bodysignal.api.service.PlateauDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIAnalysisController {

    private final AIAnalysisService       aiAnalysisService;
    private final PlateauDetectionService plateauDetectionService;

    /**
     * Daily record için AI analiz sonucu getir
     */
    @GetMapping("/latest")
    public ResponseEntity<AIAnalysisResponseDto> getLatest(Principal principal) {
        AIAnalysis analysis = aiAnalysisService.getLatest(principal.getName());
        return ResponseEntity.ok(mapToDto(analysis));
    }

    @PostMapping("/recalculate-scores")
    public ResponseEntity<String> recalculateScores() {
        int count = aiAnalysisService.recalculateAllScores();
        return ResponseEntity.ok(count + " kayıt güncellendi");
    }

    @GetMapping("/history")
    public ResponseEntity<List<AIAnalysisResponseDto>> getHistory(Principal principal) {
        List<AIAnalysisResponseDto> history = aiAnalysisService.getHistory(principal.getName())
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/plateau-status")
    public ResponseEntity<PlateauStatus> getPlateauStatus(Principal principal) {
        return ResponseEntity.ok(plateauDetectionService.detect(principal.getName()));
    }

    @GetMapping("/{recordId}")
    public ResponseEntity<AIAnalysisResponseDto> getAnalysis(
            @PathVariable Long recordId,
            Principal principal) {

        AIAnalysis analysis =
                aiAnalysisService.getByRecordId(
                        recordId,
                        principal.getName()
                );

        return ResponseEntity.ok(mapToDto(analysis));
    }

    private AIAnalysisResponseDto mapToDto(AIAnalysis a) {
        AIAnalysisResponseDto dto = new AIAnalysisResponseDto();
        dto.setId(a.getId());
        dto.setAnalysisText(a.getAnalysisText());
        dto.setGeneralComment(a.getGeneralComment());
        dto.setStrengthPoint(a.getStrengthPoint());
        dto.setImprovementPoint(a.getImprovementPoint());
        dto.setTomorrowSuggestion(a.getTomorrowSuggestion());
        dto.setRecoveryScore(a.getRecoveryScore());
        dto.setCreatedAt(a.getCreatedAt());

        DailyRecord record = a.getDailyRecord();
        if (record == null) return dto;
        dto.setDailyRecordId(record.getId());

        // Uyku süresi
        try {
            LocalTime sleep = LocalTime.parse(record.getSleepTime());
            LocalTime wake  = LocalTime.parse(record.getWakeUpTime());
            long mins = Duration.between(sleep, wake).toMinutes();
            if (mins < 0) mins += 24 * 60;
            double hours = Math.round(mins / 60.0 * 10) / 10.0;
            dto.setSleepHours(hours);
            dto.setSleepScore(Math.min(hours / 8.0, 1.0) * 50.0);
        } catch (Exception ignored) {}

        // Egzersiz metrikleri
        if (record.getWorkout() != null && record.getWorkout().getExercises() != null) {
            List<Exercise> ex = record.getWorkout().getExercises();
            dto.setExerciseCount(ex.size());
            double avgRpe = ex.stream()
                    .mapToInt(e -> e.getLastSetRpe() != null ? e.getLastSetRpe() : 8)
                    .average().orElse(8);
            dto.setAvgRpe(Math.round(avgRpe * 10) / 10.0);
            dto.setRpeScore(Math.max(0, (10.0 - avgRpe) / 9.0) * 50.0);
            double vol = ex.stream().mapToDouble(e ->
                    (e.getWeight() != null ? e.getWeight() : 0) *
                    (e.getSets()   != null ? e.getSets()   : 0) *
                    (e.getRepCount()!= null ? e.getRepCount(): 0)).sum();
            dto.setTotalVolume(Math.round(vol * 10) / 10.0);
            double maxW = ex.stream().mapToDouble(e ->
                    e.getWeight() != null ? e.getWeight() : 0).max().orElse(0);
            dto.setMaxWeight(maxW);
        }

        return dto;
    }
}
