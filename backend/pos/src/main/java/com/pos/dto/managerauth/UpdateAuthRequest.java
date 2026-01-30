// src/main/java/com/pos/dto/managerauth/UpdateAuthRequest.java
package com.pos.dto.managerauth;

import jakarta.validation.constraints.Pattern;

/** Update a manager’s return-auth. Both fields are optional. */
public class UpdateAuthRequest {

    /** Optional PIN: must be 4–8 digits when present. */
    @Pattern(regexp = "^(|\\d{4,8})$", message = "PIN must be 4–8 digits")
    private String pin;

    /** Optional card UID. */
    private String cardUid;

    // getters/setters
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public String getCardUid() { return cardUid; }
    public void setCardUid(String cardUid) { this.cardUid = cardUid; }
}
