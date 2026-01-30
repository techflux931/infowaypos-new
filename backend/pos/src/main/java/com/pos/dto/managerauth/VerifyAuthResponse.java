// src/main/java/com/pos/dto/managerauth/VerifyAuthResponse.java
package com.pos.dto.managerauth;

/** Response from return authorization verification. */
public class VerifyAuthResponse {

    private boolean ok;
    private String message;         // optional error/info
    private SimpleUser user;        // present when ok=true

    public VerifyAuthResponse() {}

    public VerifyAuthResponse(boolean ok, String message, SimpleUser user) {
        this.ok = ok;
        this.message = message;
        this.user = user;
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public SimpleUser getUser() { return user; }
    public void setUser(SimpleUser user) { this.user = user; }

    /** Minimal user payload returned on success. */
    public static class SimpleUser {
        private String id;
        private String fullName;
        private String username;

        public SimpleUser() {}

        public SimpleUser(String id, String fullName, String username) {
            this.id = id;
            this.fullName = fullName;
            this.username = username;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }
}
