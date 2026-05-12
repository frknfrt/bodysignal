package com.bodysignal.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "daily_records")
@Getter
@Setter
public class DailyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recordDate;

    private String sleepTime;
    private String wakeUpTime;

    private Double morningWeight;

    @ManyToOne
    private User user;

    @OneToOne(cascade = CascadeType.ALL)
    private Workout workout;
}
