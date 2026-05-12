package com.bodysignal.api.service;

import com.bodysignal.api.domain.User;
import com.bodysignal.api.dto.RegisterRequest;
import com.bodysignal.api.dto.UserProfileDto;

public interface UserService {
    void register(RegisterRequest request);
    void changePassword(String email, String currentPassword, String newPassword);
    void deleteAccount(String email);
    UserProfileDto getProfile(String email);
    void updateProfile(String email, UserProfileDto dto);
    User findByEmail(String email);
}
