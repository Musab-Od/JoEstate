package com.joestate.backend.controllers;

import com.joestate.backend.dto.AuthResponse;
import com.joestate.backend.dto.LoginRequest;
import com.joestate.backend.dto.RegisterRequest;
import com.joestate.backend.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // 1. Tells Spring: "This class handles HTTP requests"
@RequestMapping("/api/auth") // 2. All endpoints here start with /api/auth
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // The @RequestBody converts the JSON from React into your Java DTO
        return ResponseEntity.ok(authService.register(request));
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}