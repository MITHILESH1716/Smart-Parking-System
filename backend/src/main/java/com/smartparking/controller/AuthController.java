package com.smartparking.controller;

import com.smartparking.dto.Dtos.*;
import com.smartparking.dto.GoogleLoginRequest;
import com.smartparking.exception.ApiException;
import com.smartparking.model.Role;
import com.smartparking.model.User;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.JwtService;
import com.smartparking.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GoogleAuthService googleAuth;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, GoogleAuthService googleAuth) {
        this.users = users; this.encoder = encoder; this.jwt = jwt; this.googleAuth = googleAuth;
    }

    private AuthResponse resp(User u) {
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u.getId(), u.getName(), u.getEmail(), u.getRole().name());
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        if (users.existsByEmailIgnoreCase(r.email())) throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        User u = new User();
        u.setName(r.name().trim()); u.setEmail(r.email().trim().toLowerCase());
        u.setPassword(encoder.encode(r.password())); u.setRole(Role.USER);
        return resp(users.save(u));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) { return doLogin(r, Role.USER); }

    @PostMapping("/admin/login")
    public AuthResponse adminLogin(@Valid @RequestBody LoginRequest r) { return doLogin(r, Role.ADMIN); }

    @PostMapping("/google")
    public AuthResponse googleLogin(@RequestBody GoogleLoginRequest request) {
        if (request == null || request.credential() == null || request.credential().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Google credential is required");
        }

        final com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload;
        try {
            payload = googleAuth.verify(request.credential());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }

        String googleId = payload.getSubject();
        String email = payload.getEmail().trim().toLowerCase();
        User user = users.findByGoogleId(googleId)
                .or(() -> users.findByEmailIgnoreCase(email))
                .orElseGet(User::new);
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admins must sign in with their email and password");
        }

        user.setGoogleId(googleId);
        user.setEmail(email);
        String name = (String) payload.get("name");
        user.setName(name == null || name.isBlank() ? email : name);
        String picture = (String) payload.get("picture");
        user.setPicture(picture);
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(encoder.encode(UUID.randomUUID().toString()));
        }
        return resp(users.save(user));
    }

    private AuthResponse doLogin(LoginRequest r, Role expected) {
        User u = users.findByEmailIgnoreCase(r.email().trim())
                .filter(x -> encoder.matches(r.password(), x.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (u.getRole() != expected)
            throw new ApiException(HttpStatus.FORBIDDEN, expected == Role.ADMIN ? "This account is not an admin" : "Admins must sign in from the admin login page");
        return resp(u);
    }
}
