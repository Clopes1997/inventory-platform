package com.inventory.common;

/**
 * Thrown when a business rule conflict occurs (e.g. duplicate code, duplicate association).
 * Mapped to HTTP 409 Conflict.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
