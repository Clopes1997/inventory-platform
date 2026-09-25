package com.inventory.auth;

import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class DefaultUserSeederTest {
    @Test
    void disabledBootstrapDoesNotReadOrWriteUsers() {
        var repository = mock(UserRepository.class);
        new DefaultUserSeeder().onStart(null, repository);
        verifyNoInteractions(repository);
    }

    @Test
    void bootstrapDoesNotReplaceExistingUsers() {
        var repository = mock(UserRepository.class);
        when(repository.countUsers()).thenReturn(1L);
        var seeder = new DefaultUserSeeder();
        seeder.bootstrapEnabled = true;
        seeder.onStart(null, repository);
        verify(repository, never()).persist(any(User.class));
    }

    @Test
    void explicitBootstrapRejectsMissingCredentials() {
        var seeder = new DefaultUserSeeder();
        seeder.bootstrapEnabled = true;
        seeder.defaultUsername = Optional.empty();
        seeder.defaultPassword = Optional.empty();
        assertThatThrownBy(() -> seeder.onStart(null, mock(UserRepository.class)))
                .isInstanceOf(IllegalStateException.class);
    }
}
