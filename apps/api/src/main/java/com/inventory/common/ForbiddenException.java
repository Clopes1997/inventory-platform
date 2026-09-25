package com.inventory.common;

/**
 * Thrown when the current user is not allowed to perform the action.
 * Mapped to HTTP 403 Forbidden.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
