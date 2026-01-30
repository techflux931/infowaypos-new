package com.pos.analytics.dto;

public class PaymentSlice {
    private String name; // Card / Cash / Other
    private double pct;  // 0..100

    public PaymentSlice() { }

    public PaymentSlice(String name, double pct) {
        this.name = name;
        this.pct = pct;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPct() { return pct; }
    public void setPct(double pct) { this.pct = pct; }
}
