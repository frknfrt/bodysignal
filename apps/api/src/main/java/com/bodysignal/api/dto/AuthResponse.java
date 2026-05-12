package com.bodysignal.api.dto;

import com.bodysignal.api.domain.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private User   user;
}
