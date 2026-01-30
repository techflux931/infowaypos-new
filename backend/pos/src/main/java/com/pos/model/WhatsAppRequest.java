package com.pos.model;

import java.util.List;

public class WhatsAppRequest {
    private List<String> toNumbers;
    private String message;

    public List<String> getToNumbers() {
        return toNumbers;
    }

    public void setToNumbers(List<String> toNumbers) {
        this.toNumbers = toNumbers;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
