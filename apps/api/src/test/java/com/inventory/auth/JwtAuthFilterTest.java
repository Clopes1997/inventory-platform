package com.inventory.auth;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.util.concurrent.atomic.AtomicReference;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class JwtAuthFilterTest {
    private final AuthService auth = mock(AuthService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final JwtAuthFilter filter = new JwtAuthFilter(auth, users);

    private ContainerRequestContext request(String path, String method) {
        var request = mock(ContainerRequestContext.class);
        var uri = mock(UriInfo.class);
        when(request.getUriInfo()).thenReturn(uri);
        when(uri.getPath()).thenReturn(path);
        when(request.getMethod()).thenReturn(method);
        var headers = new MultivaluedHashMap<String, String>();
        headers.add("Authorization", "Bearer test-token");
        when(request.getHeaders()).thenReturn(headers);
        return request;
    }

    @Test
    void onlyTheExactLoginPostBypassesAuthentication() throws Exception {
        filter.filter(request("/api/auth/login", "POST"));
        verifyNoInteractions(auth, users);
        for (String path : new String[]{"api/products/auth/login", "api/products/openapi", "api/auth/login/extra"}) {
            var request = request(path, "GET");
            filter.filter(request);
            verify(request).abortWith(any(Response.class));
        }
        var loginGet = request("api/auth/login", "GET");
        filter.filter(loginGet);
        verify(loginGet).abortWith(any(Response.class));
    }

    @Test
    void aDeletedUserCannotUseAnOtherwiseValidToken() throws Exception {
        when(auth.validateToken("test-token")).thenReturn(7L);
        var request = request("api/products", "GET");
        filter.filter(request);
        var response = ArgumentCaptor.forClass(Response.class);
        verify(request).abortWith(response.capture());
        assertThat(response.getValue().getStatus()).isEqualTo(401);
        verify(request, never()).setSecurityContext(any());
    }

    @Test
    void contextUsesCurrentRoleAndDoesNotRecurseAfterReplacement() throws Exception {
        when(auth.validateToken("test-token")).thenReturn(7L);
        User user = new User();
        user.setId(7L);
        user.setUsername("renamed-user");
        user.setRole("VIEWER");
        when(users.findById(7L)).thenReturn(user);
        var request = request("api/products", "GET");
        var original = mock(SecurityContext.class);
        when(original.isSecure()).thenReturn(true);
        var context = new AtomicReference<SecurityContext>(original);
        when(request.getSecurityContext()).thenAnswer(invocation -> context.get());
        doAnswer(invocation -> { context.set(invocation.getArgument(0)); return null; })
                .when(request).setSecurityContext(any());
        filter.filter(request);
        assertThat(context.get().isSecure()).isTrue();
        assertThat(context.get().isUserInRole("VIEWER")).isTrue();
        assertThat(context.get().isUserInRole("ADMIN")).isFalse();
        assertThat(context.get().getUserPrincipal().getName()).isEqualTo("renamed-user");
    }
}
