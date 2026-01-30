package com.pos.analytics.dto;

public class TopProductDTO {
    private String name;
    private long   qty;
    private double pct; // e.g., percentage-of-top (or use it for amount if you prefer)

    public TopProductDTO() {}

    // This matches the constructor your service complained about: (String, long, double)
    public TopProductDTO(String name, long qty, double pct) {
        this.name = name;
        this.qty  = qty;
        this.pct  = pct;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getQty() { return qty; }
    public void setQty(long qty) { this.qty = qty; }

    public double getPct() { return pct; }
    public void setPct(double pct) { this.pct = pct; }
}
