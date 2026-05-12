package com.bodysignal.api.service;

import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.Exercise;
import com.bodysignal.api.domain.User;
import com.bodysignal.api.domain.Workout;
import com.bodysignal.api.dto.DailyRecordDto;
import com.bodysignal.api.dto.PlateauStatus;
import com.bodysignal.api.repository.DailyRecordRepository;
import com.bodysignal.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyRecordService {

    private final DailyRecordRepository    dailyRecordRepository;
    private final UserRepository           userRepository;
    private final AIAnalysisService        aiAnalysisService;
    private final PlateauDetectionService  plateauDetectionService;

    @Transactional
    public void createDailyRecord(
            DailyRecordDto request) {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
        User user = userRepository
                .findByEmail(email)
                .orElseThrow();

        Workout workout = new Workout();

        List<Exercise> exerciseList = request.getWorkout()
                .getExercises()
                .stream()
                .map(req -> {
                    Exercise e = new Exercise();
                    e.setName(req.getName());
                    e.setWeight(req.getWeight());
                    e.setRepCount(req.getRepCount());
                    e.setSets(req.getSets());
                    e.setLastSetRpe(req.getLastSetRpe());
                    e.setWorkout(workout);
                    return e;
                }).toList();

        workout.setExercises(exerciseList);
        workout.setUser(user);

        DailyRecord record = new DailyRecord();
        record.setRecordDate(request.getRecordDate());
        record.setSleepTime(request.getSleepTime());
        record.setWakeUpTime(request.getWakeUpTime());
        record.setMorningWeight(request.getMorningWeight());
        record.setWorkout(workout);
        record.setUser(user);

        // 1. Veriyi veritabanına kaydediyoruz (Burası çalışmalı!)
        dailyRecordRepository.save(record);

        // 2. AI analizi
        aiAnalysisService.analyzeAndSave(record, email);

        // 3. Plateau tespiti — sonucu logla
        try {
            PlateauStatus plateau = plateauDetectionService.detect(email);
            if (!"NONE".equals(plateau.getPlateauType())) {
                log.warn("PLATEAU [{}] {} — {}", plateau.getSeverity(), plateau.getPlateauType(), plateau.getReason());
            }
        } catch (Exception e) {
            log.error("Plateau detection failed", e);
        }
    }
}