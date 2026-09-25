package com.inventory.auth;

import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    private final AuthService authService;

    public AuthResource(AuthService authService) {
        this.authService = authService;
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequestDto dto) {
        if (!authService.validateCredentials(dto.getUsername(), dto.getPassword())) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new AuthError("Invalid username or password"))
                    .build();
        }
        String token = authService.createToken(dto.getUsername());
        return Response.ok(new LoginResponseDto(token)).build();
    }

    public static class AuthError {
        public String message;
        public AuthError(String message) {
            this.message = message;
        }
    }
}
