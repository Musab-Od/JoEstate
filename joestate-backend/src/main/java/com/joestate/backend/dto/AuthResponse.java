package com.joestate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;       // The JWT Token
    private String firstName;
    private String lastName;
    private String role; // For showing/hiding admin features in frontend
    private Long userId; // For routing to user-specific pages
}