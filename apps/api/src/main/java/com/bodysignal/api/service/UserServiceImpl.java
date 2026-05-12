package com.bodysignal.api.service;

import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.User;
import com.bodysignal.api.dto.RegisterRequest;
import com.bodysignal.api.dto.UserProfileDto;
import com.bodysignal.api.repository.AIAnalysisRepository;
import com.bodysignal.api.repository.DailyRecordRepository;
import com.bodysignal.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final DailyRecordRepository dailyRecordRepository;

    @Override
    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mevcut şifre yanlış");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Yeni şifre en az 6 karakter olmalı");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        // Analizleri sil (DailyRecord'a FK var)
        aiAnalysisRepository.deleteAllByUserEmail(email);
        // DailyRecord'ları sil (Workout cascade ile silinir)
        List<DailyRecord> records = dailyRecordRepository.findByUserId(user.getId());
        dailyRecordRepository.deleteAll(records);
        // Kullanıcıyı sil
        userRepository.delete(user);
    }

    @Override
    public UserProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        UserProfileDto dto = new UserProfileDto();
        dto.setFullName(user.getFullName());
        dto.setAge(user.getAge());
        dto.setHeight(user.getHeight());
        dto.setTargetWeight(user.getTargetWeight());
        dto.setCurrentWeight(user.getCurrentWeight());
        dto.setActivityLevel(user.getActivityLevel());
        dto.setGender(user.getGender());
        dto.setGoalType(user.getGoalType());
        dto.setWeeklyWorkoutDays(user.getWeeklyWorkoutDays());
        dto.setExperienceLevel(user.getExperienceLevel());
        dto.setPreferredWorkoutType(user.getPreferredWorkoutType());
        return dto;
    }

    @Override
    public void updateProfile(String email, UserProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        if (dto.getFullName()            != null) user.setFullName(dto.getFullName());
        if (dto.getAge()                 != null) user.setAge(dto.getAge());
        if (dto.getHeight()              != null) user.setHeight(dto.getHeight());
        if (dto.getTargetWeight()        != null) user.setTargetWeight(dto.getTargetWeight());
        if (dto.getCurrentWeight()       != null) user.setCurrentWeight(dto.getCurrentWeight());
        if (dto.getActivityLevel()       != null) user.setActivityLevel(dto.getActivityLevel());
        if (dto.getGender()              != null) user.setGender(dto.getGender());
        if (dto.getGoalType()            != null) user.setGoalType(dto.getGoalType());
        if (dto.getWeeklyWorkoutDays()   != null) user.setWeeklyWorkoutDays(dto.getWeeklyWorkoutDays());
        if (dto.getExperienceLevel()     != null) user.setExperienceLevel(dto.getExperienceLevel());
        if (dto.getPreferredWorkoutType()!= null) user.setPreferredWorkoutType(dto.getPreferredWorkoutType());
        userRepository.save(user);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElse(null);
    }
}
