package com.inventory.auth;

/** Public endpoints are matched exactly, never as arbitrary path substrings. */
public final class AuthBypassPaths {
    private AuthBypassPaths() { }

    public static boolean isPublic(String path, String method) {
        return "POST".equalsIgnoreCase(method) && "api/auth/login".equals(path);
    }
}
