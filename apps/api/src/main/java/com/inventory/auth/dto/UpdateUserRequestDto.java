package com.inventory.auth.dto;

import jakarta.validation.constraints.Size;

public class UpdateUserRequestDto {

    @Size(max = 255)
    private String username;

    @Size(min = 6, message = "password must be at least 6 characters when provided")
    private String password;

    private String role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
