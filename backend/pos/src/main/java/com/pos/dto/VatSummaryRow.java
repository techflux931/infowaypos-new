package com.pos.dto;

public class VatSummaryRow {
  private String date;
  private long bills;
  private double taxable;
  private double vat;
  private double total;

  public VatSummaryRow() {}

  public VatSummaryRow(String date, long bills, double taxable, double vat, double total) {
    this.date = date; this.bills = bills; this.taxable = taxable; this.vat = vat; this.total = total;
  }

  public String getDate() { return date; }
  public void setDate(String date) { this.date = date; }
  public long getBills() { return bills; }
  public void setBills(long bills) { this.bills = bills; }
  public double getTaxable() { return taxable; }
  public void setTaxable(double taxable) { this.taxable = taxable; }
  public double getVat() { return vat; }
  public void setVat(double vat) { this.vat = vat; }
  public double getTotal() { return total; }
  public void setTotal(double total) { this.total = total; }
}
