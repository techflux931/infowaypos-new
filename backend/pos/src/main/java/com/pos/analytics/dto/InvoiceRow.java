package com.pos.analytics.dto;

public class InvoiceRow {
    private String no;
    private String date;     // yyyy-MM-dd
    private String customer;
    private double amount;
    private String status;

    public InvoiceRow() { }

    public InvoiceRow(String no, String date, String customer, double amount, String status) {
        this.no = no;
        this.date = date;
        this.customer = customer;
        this.amount = amount;
        this.status = status;
    }

    public String getNo() { return no; }
    public void setNo(String no) { this.no = no; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
