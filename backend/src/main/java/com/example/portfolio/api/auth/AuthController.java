package com.example.portfolio.api.auth;

import com.example.portfolio.api.auth.dto.AuthResponse;
import com.example.portfolio.api.auth.dto.LoginRequest;
import com.example.portfolio.api.auth.dto.SignupRequest;
import com.example.portfolio.api.auth.dto.UserSummary;
import com.example.portfolio.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/signup")
    AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/auth/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    UserSummary me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.me(principal.getId());
    }
}
