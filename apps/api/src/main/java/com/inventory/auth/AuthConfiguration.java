package com.inventory.auth;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.nio.charset.StandardCharsets;

@ApplicationScoped
public class AuthConfiguration {
    @ConfigProperty(name = "auth.jwt.secret")
    String secret;

    void validate(@Observes StartupEvent event) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("INVENTORY_AUTH_SECRET must contain at least 32 bytes");
        }
    }
}
