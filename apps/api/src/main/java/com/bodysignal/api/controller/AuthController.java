package com.bodysignal.api.controller;

import com.bodysignal.api.domain.User;
import com.bodysignal.api.dto.AuthResponse;
import com.bodysignal.api.dto.Login;
import com.bodysignal.api.dto.RegisterRequest;
import com.bodysignal.api.repository.UserRepository;
import com.bodysignal.api.service.AuthService;
import com.bodysignal.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.ok("User registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Login request) {
        String token = authService.login(request);
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

}
