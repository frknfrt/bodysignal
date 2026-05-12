package com.bodysignal.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis")
@Getter
@Setter
public class AIAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    @OneToOne
    private DailyRecord dailyRecord;

    @Column(length = 2000)
    private String analysisText;        // backward-compat: = generalComment for new records

    @Column(length = 1000)
    private String generalComment;

    @Column(length = 1000)
    private String strengthPoint;

    @Column(length = 1000)
    private String improvementPoint;

    @Column(length = 1000)
    private String tomorrowSuggestion;

    private String analysisTitle;
    private Double recoveryScore;

    private LocalDateTime createdAt;
}
