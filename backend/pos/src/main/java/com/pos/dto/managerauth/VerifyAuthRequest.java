// src/main/java/com/pos/dto/managerauth/VerifyAuthRequest.java
package com.pos.dto.managerauth;

import jakarta.validation.constraints.Pattern;

/** Request to verify manager/admin authorization for a return. */
public class VerifyAuthRequest {

    /** Optional PIN: must be 4–8 digits when provided. */
    @Pattern(regexp = "^(|\\d{4,8})$", message = "PIN must be 4–8 digits")
    private String pin;

    /** Optional card UID (format not enforced here). */
    private String cardUid;

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public String getCardUid() { return cardUid; }
    public void setCardUid(String cardUid) { this.cardUid = cardUid; }
}
