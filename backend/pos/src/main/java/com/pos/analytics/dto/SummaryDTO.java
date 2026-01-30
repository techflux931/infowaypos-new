package com.pos.analytics.dto;

public class SummaryDTO {
    private double grossSales;
    private double purchase;
    private double profit;
    private long   customers;
    private double avgBill;
    private double vat;

    public SummaryDTO() {}

    public SummaryDTO(double grossSales, double purchase, double profit,
                      long customers, double avgBill, double vat) {
        this.grossSales = grossSales;
        this.purchase   = purchase;
        this.profit     = profit;
        this.customers  = customers;
        this.avgBill    = avgBill;
        this.vat        = vat;
    }

    public double getGrossSales() { return grossSales; }
    public void setGrossSales(double grossSales) { this.grossSales = grossSales; }

    public double getPurchase() { return purchase; }
    public void setPurchase(double purchase) { this.purchase = purchase; }

    public double getProfit() { return profit; }
    public void setProfit(double profit) { this.profit = profit; }

    public long getCustomers() { return customers; }
    public void setCustomers(long customers) { this.customers = customers; }

    public double getAvgBill() { return avgBill; }
    public void setAvgBill(double avgBill) { this.avgBill = avgBill; }

    public double getVat() { return vat; }
    public void setVat(double vat) { this.vat = vat; }
}
