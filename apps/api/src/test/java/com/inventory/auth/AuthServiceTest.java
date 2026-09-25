package com.inventory.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final AuthService auth = new AuthService(users);

    AuthServiceTest() { auth.jwtSecret = "isolated-unit-test-signing-secret-long-enough"; }

    @Test
    void tokenUsesStableIdAndThirtyMinuteExpiration() {
        User user = new User();
        user.setId(42L);
        user.setUsername("operator");
        when(users.findByUsername("operator")).thenReturn(Optional.of(user));
        String token = auth.createToken(" operator ");
        assertThat(auth.validateToken(token)).isEqualTo(42L);
        var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(auth.jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .build().parseSignedClaims(token).getPayload();
        assertThat(claims.getExpiration().getTime() - claims.getIssuedAt().getTime()).isEqualTo(1_800_000L);
    }

    @Test
    void oldUsernameTokensAndExpiredTokensAreRejected() {
        var key = Keys.hmacShaKeyFor(auth.jwtSecret.getBytes(StandardCharsets.UTF_8));
        String legacy = Jwts.builder().subject("operator").expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key).compact();
        String expired = Jwts.builder().issuer("inventory").subject("user:42")
                .expiration(new Date(0)).signWith(key).compact();
        assertThat(auth.validateToken(legacy)).isNull();
        assertThat(auth.validateToken(expired)).isNull();
        assertThat(auth.validateToken("not-a-token")).isNull();
    }
}
