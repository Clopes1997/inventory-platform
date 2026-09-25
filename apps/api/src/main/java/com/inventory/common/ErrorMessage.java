package com.inventory.common;

/**
 * JSON body for error responses from exception mappers.
 */
public class ErrorMessage {
    public String message;

    public ErrorMessage(String message) {
        this.message = message;
    }
}
