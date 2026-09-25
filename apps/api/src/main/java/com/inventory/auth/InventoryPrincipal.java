package com.inventory.auth;

import java.security.Principal;

public class InventoryPrincipal implements Principal {

    private final String name;
    private final String role;

    public InventoryPrincipal(String name, String role) {
        this.name = name;
        this.role = role != null ? role : "VIEWER";
    }

    @Override
    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isOperatorOrAdmin() {
        return "ADMIN".equals(role) || "OPERATOR".equals(role);
    }
}
