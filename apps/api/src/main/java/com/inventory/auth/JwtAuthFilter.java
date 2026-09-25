package com.inventory.auth;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.util.List;
import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;

/**
 * JWT authentication filter. All requests under {@code api/} or {@code q/} require
 * a valid Bearer token unless the path matches one of the bypass patterns in
 * {@link AuthBypassPaths}, or the method is OPTIONS.
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter {

    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;
    private final UserRepository userRepository;

    public JwtAuthFilter(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String path = requestContext.getUriInfo().getPath().replaceFirst("^/+", "");
        boolean requireAuth = path.equals("api") || path.startsWith("api/") || path.equals("q") || path.startsWith("q/");
        if (!requireAuth) {
            return;
        }
        if (AuthBypassPaths.isPublic(path, requestContext.getMethod())) {
            return;
        }
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }

        List<String> authHeaders = requestContext.getHeaders().get(AUTHORIZATION);
        String token = null;
        if (authHeaders != null && authHeaders.size() == 1) {
            String value = authHeaders.get(0);
            if (value != null && value.startsWith(BEARER_PREFIX)) {
                token = value.substring(BEARER_PREFIX.length()).trim();
            }
        }

        Long userId = authService.validateToken(token);
        User user = userId == null ? null : userRepository.findById(userId);
        if (user == null) {
            requestContext.abortWith(
                    Response.status(Response.Status.UNAUTHORIZED)
                            .entity("{\"message\":\"Unauthorized\"}")
                            .type("application/json")
                            .build());
            return;
        }

        String username = user.getUsername();
        String role = user.getRole();
        InventoryPrincipal principal = new InventoryPrincipal(username, role);
        SecurityContext originalContext = requestContext.getSecurityContext();
        boolean secure = originalContext != null && originalContext.isSecure();

        SecurityContext securityContext = new SecurityContext() {
            @Override
            public java.security.Principal getUserPrincipal() {
                return principal;
            }

            @Override
            public boolean isUserInRole(String roleName) {
                return roleName != null && roleName.equals(role);
            }

            @Override
            public boolean isSecure() {
                return secure;
            }

            @Override
            public String getAuthenticationScheme() {
                return "Bearer";
            }
        };
        requestContext.setSecurityContext(securityContext);
        requestContext.setProperty("auth.username", username);
    }
}
