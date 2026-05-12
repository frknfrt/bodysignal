package com.bodysignal.api.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlateauStatus {
    private String plateauType;   // PERFORMANCE, RECOVERY, MOTIVATION, NONE
    private String severity;      // LOW, MEDIUM, HIGH
    private String reason;
    private LocalDateTime detectedAt;
}
