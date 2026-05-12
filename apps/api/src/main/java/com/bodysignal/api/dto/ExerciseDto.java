package com.bodysignal.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseDto {

    private String name;
    private Double weight;
    private Integer setCount;
    private Integer repCount;
    private Integer lastSetRpe;
}