package com.pos.analytics.dto;

public class SeriesPointDTO {
    private String label;
    private double sales;
    private double purchase;

    public SeriesPointDTO() { }

    public SeriesPointDTO(String label, double sales, double purchase) {
        this.label = label;
        this.sales = sales;
        this.purchase = purchase;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public double getSales() { return sales; }
    public void setSales(double sales) { this.sales = sales; }

    public double getPurchase() { return purchase; }
    public void setPurchase(double purchase) { this.purchase = purchase; }
}
