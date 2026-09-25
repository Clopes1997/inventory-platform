package com.inventory.common;

import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;

@Provider
public class OptimisticLockMapper implements ExceptionMapper<OptimisticLockException> {
    public Response toResponse(OptimisticLockException exception) {
        return Response.status(409).entity(Map.of("message", "Record changed concurrently. Reload before saving."))
                .type("application/json").build();
    }
}
