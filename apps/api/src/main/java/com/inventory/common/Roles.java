package com.inventory.common;

import com.inventory.auth.InventoryPrincipal;

import jakarta.ws.rs.core.SecurityContext;

/**
 * Role checks for authorization. Use SecurityContext from JWT filter.
 */
public final class Roles {

    private Roles() {
    }

    /**
     * Requires current user to be ADMIN. Throws ForbiddenException otherwise.
     */
    public static void requireAdmin(SecurityContext securityContext) {
        if (securityContext == null || securityContext.getUserPrincipal() == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (!(securityContext.getUserPrincipal() instanceof InventoryPrincipal p) || !p.isAdmin()) {
            throw new ForbiddenException("Admin role required");
        }
    }

    /**
     * Requires current user to be OPERATOR or ADMIN for write operations. Throws ForbiddenException otherwise.
     */
    public static void requireOperatorOrAdmin(SecurityContext securityContext) {
        if (securityContext == null || securityContext.getUserPrincipal() == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (!(securityContext.getUserPrincipal() instanceof InventoryPrincipal p) || !p.isOperatorOrAdmin()) {
            throw new ForbiddenException("Operator or Admin role required");
        }
    }

    /**
     * Returns the current username from SecurityContext, or null if not authenticated.
     */
    public static String currentUsername(SecurityContext securityContext) {
        if (securityContext == null || securityContext.getUserPrincipal() == null) {
            return null;
        }
        return securityContext.getUserPrincipal().getName();
    }
}
