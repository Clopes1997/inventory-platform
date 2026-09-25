package com.inventory.common;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestMapper implements ExceptionMapper<BadRequestException> {
    public Response toResponse(BadRequestException exception) {
        return Response.status(400).entity(new ErrorMessage(exception.getMessage())).type("application/json").build();
    }
}
