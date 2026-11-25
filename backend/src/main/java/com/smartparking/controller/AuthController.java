package com.smartparking.controller;

import com.smartparking.dto.Dtos.*;
import com.smartparking.exception.ApiException;
import com.smartparking.model.Role;
import com.smartparking.model.User;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
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

    private AuthResponse doLogin(LoginRequest r, Role expected) {
        User u = users.findByEmailIgnoreCase(r.email().trim())
                .filter(x -> encoder.matches(r.password(), x.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (u.getRole() != expected)
            throw new ApiException(HttpStatus.FORBIDDEN, expected == Role.ADMIN ? "This account is not an admin" : "Admins must sign in from the admin login page");
        return resp(u);
    }
}
