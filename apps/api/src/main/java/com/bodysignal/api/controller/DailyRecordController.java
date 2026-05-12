package com.bodysignal.api.controller;

import com.bodysignal.api.dto.DailyRecordDto;
import com.bodysignal.api.service.DailyRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/daily-records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DailyRecordController {
    private final DailyRecordService dailyRecordService;

    @PostMapping
        public ResponseEntity<?> create(
                @RequestBody DailyRecordDto request ) {

            dailyRecordService.createDailyRecord(
                    request
            );

        return ResponseEntity.ok("Günlük kayıt oluşturuldu");
    }
}
