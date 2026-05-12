package com.bodysignal.api.controller;

import com.bodysignal.api.dto.PlateauStatus;
import com.bodysignal.api.service.PlateauDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/plateau")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PlateauController {

    private final PlateauDetectionService plateauDetectionService;

    @GetMapping("/status")
    public ResponseEntity<PlateauStatus> getStatus(Principal principal) {
        return ResponseEntity.ok(plateauDetectionService.detect(principal.getName()));
    }
}
