// src/main/java/com/pos/dto/ManagerDto.java
package com.pos.dto;

import com.pos.model.User;

public class ManagerDto {
    private String id;
    private String fullName;
    private String username;
    private String role;
    private boolean enabled;

    public ManagerDto() {}

    public ManagerDto(String id, String fullName, String username, String role, boolean enabled) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.role = role;
        this.enabled = enabled;
    }

    public static ManagerDto from(User u) {
        if (u == null) return null;
        String name = u.getUsername(); // fallback, since User has no fullName
        return new ManagerDto(u.getId(), name, u.getUsername(), u.getRole(), u.isEnabled());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
