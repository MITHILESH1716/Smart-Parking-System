package com.smartparking.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.smartparking.dto.GoogleLoginRequest;
import com.smartparking.model.User;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.JwtService;
import com.smartparking.service.GoogleAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/auth")
public class GoogleAuthController {
private final GoogleAuthService googleAuthService;
private final UserRepository userRepository;
private final JwtService jwtService;
private final PasswordEncoder passwordEncoder;
public GoogleAuthController(GoogleAuthService googleAuthService,
UserRepository userRepository,
JwtService jwtService,
PasswordEncoder passwordEncoder) {
this.googleAuthService = googleAuthService;
this.userRepository = userRepository;
this.jwtService = jwtService;
this.passwordEncoder = passwordEncoder;
}
@PostMapping("/google")
public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
GoogleIdToken.Payload payload;
try {
payload = googleAuthService.verify(request.credential());
} catch (IllegalArgumentException e) {
return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
}
String email = payload.getEmail();
String name = (String) payload.get("name");
String picture = (String) payload.get("picture");
User user = userRepository.findByEmail(email).orElseGet(() -> {
User u = new User();
u.setEmail(email);
u.setName(name);
// Google users have no password; store a random one so the column is never empty
u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
// u.setRole(...); <- copy the default role your normal register code uses
return u;
});
user.setGoogleId(payload.getSubject());
user.setPicture(picture);
userRepository.save(user);
// Use the same call your normal login uses to create the JWT
String token = jwtService.generateToken(user);
return ResponseEntity.ok(Map.of(
"token", token,
"email", user.getEmail(),
"name", name != null ? name : ""));
}
}