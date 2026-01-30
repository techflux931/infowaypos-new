package com.pos.dto;

public class ForgotRequest {

    private String username;

    public ForgotRequest() {
    }

    public ForgotRequest(String username) {
        this.username = username;
    }

    // Getter
    public String getUsername() {
        return username;
    }

    // Setter
    public void setUsername(String username) {
        this.username = username;
    }
}
