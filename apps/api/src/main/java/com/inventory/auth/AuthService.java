package com.inventory.auth;

import at.favre.lib.crypto.bcrypt.BCrypt;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@ApplicationScoped
public class AuthService {

    private static final long EXPIRATION_MS = 30 * 60 * 1000L;

    private final UserRepository userRepository;

    @ConfigProperty(name = "auth.jwt.secret")
    String jwtSecret;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String createToken(String username) {
        User user = userRepository.findByUsername(username.trim()).orElseThrow(
                () -> new jakarta.ws.rs.NotAuthorizedException("Bearer"));
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .issuer("inventory")
                .subject("user:" + user.getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key)
                .compact();
    }

    public boolean validateCredentials(String username, String password) {
        if (username == null || password == null) {
            return false;
        }
        Optional<User> user = userRepository.findByUsername(username.trim());
        if (user.isEmpty()) {
            return false;
        }
        BCrypt.Result result = BCrypt.verifyer().verify(password.toCharArray(), user.get().getPasswordHash());
        return result.verified;
    }

    public Long validateToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).requireIssuer("inventory").build().parseSignedClaims(token).getPayload();
            if (claims.getExpiration() == null || !claims.getExpiration().after(new Date())
                    || claims.getSubject() == null || !claims.getSubject().startsWith("user:")) {
                return null;
            }
            long id = Long.parseLong(claims.getSubject().substring(5));
            return id > 0 ? id : null;
        } catch (Exception e) {
            return null;
        }
    }
}
