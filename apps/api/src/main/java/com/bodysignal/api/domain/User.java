package com.bodysignal.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;
    private String fullName;

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

    private LocalDateTime createdAt;
}
