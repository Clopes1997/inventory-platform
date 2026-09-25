package com.inventory.common;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.logging.Level;
import java.util.logging.Logger;

@Provider
public class GenericExceptionMapper implements ExceptionMapper<Exception> {
    private static final Logger LOG = Logger.getLogger(GenericExceptionMapper.class.getName());

    @Override
    public Response toResponse(Exception e) {
        for (Throwable cause = e; cause != null; cause = cause.getCause()) {
            if (cause instanceof jakarta.persistence.OptimisticLockException || cause instanceof org.hibernate.exception.ConstraintViolationException) {
                return Response.status(409).entity(new ErrorMessage("Record conflicts with existing or concurrently changed data. Reload or review the import mapping.")).build();
            }
        }
        if (isNumberFormatCause(e)) {
            return Response.status(400).entity(new ErrorMessage("Invalid path or query parameter: ID must be a valid number")).build();
        }
        LOG.log(Level.SEVERE, "Unhandled exception", e);
        return Response.status(500).entity(new ErrorMessage("Internal server error")).build();
    }

    private static boolean isNumberFormatCause(Throwable t) {
        for (Throwable x = t; x != null; x = x.getCause()) {
            if (x instanceof NumberFormatException) return true;
        }
        return false;
    }
}
