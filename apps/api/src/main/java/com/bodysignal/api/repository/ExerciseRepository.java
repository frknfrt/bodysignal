package com.bodysignal.api.repository;

import com.bodysignal.api.domain.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository
        extends JpaRepository<Exercise, Long> {}
