package com.bodysignal.api.controller;

import com.bodysignal.api.dto.ChangePasswordRequest;
import com.bodysignal.api.dto.UserProfileDto;
import com.bodysignal.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Principal principal) {
        try {
            userService.changePassword(principal.getName(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok("Şifre güncellendi");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile(Principal principal) {
        return ResponseEntity.ok(userService.getProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfileDto dto, Principal principal) {
        try {
            userService.updateProfile(principal.getName(), dto);
            return ResponseEntity.ok("Profil güncellendi");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(Principal principal) {
        try {
            userService.deleteAccount(principal.getName());
            return ResponseEntity.ok("Hesap silindi");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
