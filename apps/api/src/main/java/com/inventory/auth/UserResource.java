package com.inventory.auth;

import com.inventory.auth.dto.CreateUserRequestDto;
import com.inventory.auth.dto.UpdateUserRequestDto;
import com.inventory.auth.dto.UserResponseDto;
import com.inventory.common.Roles;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    private final UserService userService;

    @Context
    SecurityContext securityContext;

    public UserResource(UserService userService) {
        this.userService = userService;
    }

    private String currentUsername() {
        return Roles.currentUsername(securityContext);
    }

    @GET
    public List<UserResponseDto> list() {
        Roles.requireAdmin(securityContext);
        return userService.listUsers(currentUsername());
    }

    @GET
    @Path("/me")
    public UserResponseDto me() {
        return userService.getCurrentUser(currentUsername());
    }

    @GET
    @Path("/{id}")
    public UserResponseDto get(@PathParam("id") Long id) {
        return userService.getUser(id, currentUsername());
    }

    @POST
    public Response create(@Valid CreateUserRequestDto dto) {
        Roles.requireAdmin(securityContext);
        UserResponseDto created = userService.createUser(dto, currentUsername());
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public UserResponseDto update(@PathParam("id") Long id, @Valid UpdateUserRequestDto dto) {
        return userService.updateUser(id, dto, currentUsername());
    }
}
