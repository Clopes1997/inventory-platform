package com.inventory.auth;

import at.favre.lib.crypto.bcrypt.BCrypt;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.util.Optional;

@ApplicationScoped
public class DefaultUserSeeder {

    @ConfigProperty(name = "auth.bootstrap.enabled", defaultValue = "false")
    boolean bootstrapEnabled;

    @ConfigProperty(name = "auth.default.username")
    Optional<String> defaultUsername;

    @ConfigProperty(name = "auth.default.password")
    Optional<String> defaultPassword;

    @Transactional
    void onStart(@Observes StartupEvent event, UserRepository userRepository) {
        if (!bootstrapEnabled || userRepository.countUsers() > 0) {
            return;
        }
        String username = defaultUsername.filter(value -> !value.isBlank()).orElseThrow(
                () -> new IllegalStateException("Bootstrap requires INVENTORY_AUTH_USER"));
        String password = defaultPassword.filter(value -> value.length() >= 12).orElseThrow(
                () -> new IllegalStateException("Bootstrap requires a password of at least 12 characters"));
        User user = new User();
        user.setUsername(username.trim());
        user.setPasswordHash(BCrypt.withDefaults().hashToString(10, password.toCharArray()));
        user.setRole("ADMIN");
        userRepository.persist(user);
    }
}
