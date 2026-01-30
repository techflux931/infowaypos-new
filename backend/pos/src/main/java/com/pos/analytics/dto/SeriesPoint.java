package com.pos.analytics.dto;

public class SeriesPoint {
    private String label;
    private double sales;          // percentage 0..100 for UI bar
    private double purchase;       // percentage 0..100 for UI bar
    private double salesValue;     // absolute value (optional)
    private double purchaseValue;  // absolute value (optional)

    public SeriesPoint() { }

    public SeriesPoint(String label, double sales, double purchase,
                       double salesValue, double purchaseValue) {
        this.label = label;
        this.sales = sales;
        this.purchase = purchase;
        this.salesValue = salesValue;
        this.purchaseValue = purchaseValue;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public double getSales() { return sales; }
    public void setSales(double sales) { this.sales = sales; }

    public double getPurchase() { return purchase; }
    public void setPurchase(double purchase) { this.purchase = purchase; }

    public double getSalesValue() { return salesValue; }
    public void setSalesValue(double salesValue) { this.salesValue = salesValue; }

    public double getPurchaseValue() { return purchaseValue; }
    public void setPurchaseValue(double purchaseValue) { this.purchaseValue = purchaseValue; }
}
