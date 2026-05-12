package com.bodysignal.api.repository;

import com.bodysignal.api.domain.Workout;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutRepository
        extends JpaRepository<Workout, Long> {}
