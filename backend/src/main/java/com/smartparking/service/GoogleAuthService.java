package com.smartparking.service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
@Service
public class GoogleAuthService {
private final GoogleIdTokenVerifier verifier;
public GoogleAuthService(@Value("${app.google.client-id}") String clientId) {
this.verifier = new GoogleIdTokenVerifier.Builder(
new NetHttpTransport(), GsonFactory.getDefaultInstance())
.setAudience(Collections.singletonList(clientId))
.build();
}
public GoogleIdToken.Payload verify(String idTokenString) {
try {
GoogleIdToken token = verifier.verify(idTokenString);
if (token == null) {
throw new IllegalArgumentException("Invalid Google token");
}
GoogleIdToken.Payload payload = token.getPayload();
if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
throw new IllegalArgumentException("Google email is not verified");
}
return payload;
} catch (GeneralSecurityException | IOException e) {
throw new IllegalArgumentException("Could not verify Google token", e);
}
}
}