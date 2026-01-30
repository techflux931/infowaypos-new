// src/main/java/com/pos/dto/managerauth/CreateManagerRequest.java
package com.pos.dto.managerauth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Payload to create a manager user with optional POS return auth. */
public class CreateManagerRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    /** Optional login username. Keep null/empty if not used. */
    @Size(min = 3, max = 50, message = "Username must be 3–50 chars")
    private String username;

    /** Optional login password. Only validated when present. */
    @Size(min = 4, max = 100, message = "Password must be 4–100 chars")
    private String password;

    /** Whether this manager is enabled. Defaults to true. */
    private boolean enabled = true;

    /** Optional POS return PIN: 4–8 digits if provided. */
    @Pattern(regexp = "^(|\\d{4,8})$", message = "PIN must be 4–8 digits")
    private String pin;

    /** Optional card UID (format not enforced here). */
    private String cardUid;

    // getters/setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public String getCardUid() { return cardUid; }
    public void setCardUid(String cardUid) { this.cardUid = cardUid; }
}
