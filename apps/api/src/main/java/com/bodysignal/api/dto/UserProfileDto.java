package com.bodysignal.api.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String  fullName;
    private Integer age;
    private Integer height;
    private Double  targetWeight;
    private Double  currentWeight;
    private String  activityLevel;
    private String  gender;
    private String  goalType;
    private Integer weeklyWorkoutDays;
    private String  experienceLevel;
    private String  preferredWorkoutType;
}
