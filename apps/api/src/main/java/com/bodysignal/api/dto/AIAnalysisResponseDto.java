package com.bodysignal.api.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AIAnalysisResponseDto {

    private Long id;
    private Long dailyRecordId;

    private String analysisText;       // backward-compat
    private String generalComment;
    private String strengthPoint;
    private String improvementPoint;
    private String tomorrowSuggestion;

    private Double recoveryScore;
    private String analysisTitle;
    private LocalDateTime createdAt;

    // DailyRecord'dan türetilen metrikler
    private Double sleepHours;
    private Double avgRpe;
    private Integer exerciseCount;
    private Double totalVolume;
    private Double maxWeight;
    private Double sleepScore;
    private Double rpeScore;
}
