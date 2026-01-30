// src/main/java/com/pos/dto/managerauth/ManagerAuthResponse.java
package com.pos.dto.managerauth;

/** Minimal return-auth info for a manager. */
public class ManagerAuthResponse {
    private boolean pinSet;
    private String cardUid;

    public ManagerAuthResponse() {}
    public ManagerAuthResponse(boolean pinSet, String cardUid) {
        this.pinSet = pinSet;
        this.cardUid = cardUid;
    }

    public boolean isPinSet() { return pinSet; }
    public void setPinSet(boolean pinSet) { this.pinSet = pinSet; }

    public String getCardUid() { return cardUid; }
    public void setCardUid(String cardUid) { this.cardUid = cardUid; }
}
