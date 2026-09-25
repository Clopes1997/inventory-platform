package com.inventory.common;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

/**
 * Returns 400 for invalid path/query param format (e.g. non-numeric ID).
 */
@Provider
public class NumberFormatMapper implements ExceptionMapper<NumberFormatException> {
    @Override
    public Response toResponse(NumberFormatException e) {
        String message = "Invalid path or query parameter: ID must be a valid number";
        return Response.status(400).entity(new ErrorMessage(message)).build();
    }
}
