package com.bodysignal.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "exercises")
@Getter
@Setter
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // Bench Press
    private Double weight;      // 80kg
    private Integer sets;      // 4 Set

    private Integer repCount;   // 10 tekrar

    private Integer lastSetRpe; // son set zorlanma (1–10)

    @ManyToOne
    private Workout workout;
}
