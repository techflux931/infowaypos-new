package com.pos.model;

import com.fasterxml.jackson.annotation.JsonAlias;

public class Contact {
    private String name;
    private String phone;
    private String email;
    private String role;

    /** Accept "isPrimary" from the React form */
    @JsonAlias("isPrimary")
    private boolean primary;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isPrimary() { return primary; }
    public void setPrimary(boolean primary) { this.primary = primary; }
}
