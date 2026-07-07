package com.example.portfolio.api.auth;

import com.example.portfolio.api.auth.dto.AuthResponse;
import com.example.portfolio.api.auth.dto.LoginRequest;
import com.example.portfolio.api.auth.dto.SignupRequest;
import com.example.portfolio.api.auth.dto.UserSummary;
import com.example.portfolio.common.util.SlugGenerator;
import com.example.portfolio.domain.profile.PortfolioProfile;
import com.example.portfolio.domain.profile.PortfolioProfileRepository;
import com.example.portfolio.domain.user.User;
import com.example.portfolio.domain.user.UserRepository;
import com.example.portfolio.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PortfolioProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final SlugGenerator slugGenerator;

    public AuthService(
        UserRepository userRepository,
        PortfolioProfileRepository profileRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtTokenProvider jwtTokenProvider,
        SlugGenerator slugGenerator
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.slugGenerator = slugGenerator;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        String portfolioSlug = slugGenerator.from(request.portfolioSlug());
        if (profileRepository.existsBySlug(portfolioSlug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Portfolio slug already exists");
        }

        User user = userRepository.save(new User(
            request.email().trim().toLowerCase(),
            passwordEncoder.encode(request.password()),
            request.name().trim()
        ));
        profileRepository.save(new PortfolioProfile(user, portfolioSlug, user.getName()));

        return new AuthResponse(jwtTokenProvider.generateAccessToken(user), UserSummary.from(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        return new AuthResponse(jwtTokenProvider.generateAccessToken(user), UserSummary.from(user));
    }

    @Transactional(readOnly = true)
    public UserSummary me(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserSummary.from(user);
    }
}
