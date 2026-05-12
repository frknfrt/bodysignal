package com.bodysignal.api.repository;

import com.bodysignal.api.domain.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DailyRecordRepository
        extends JpaRepository<DailyRecord, Long> {

    List<DailyRecord> findByUserId(Long userId);
}
