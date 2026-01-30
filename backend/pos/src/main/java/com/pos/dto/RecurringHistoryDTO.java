package com.pos.dto;

import java.util.Date;
import java.util.List;

public class RecurringHistoryDTO {
  private String invoiceId;
  private String invoiceNo;
  private Date createdAt;
  private double total;
  private List<ItemLine> items;

  public RecurringHistoryDTO() {}

  public RecurringHistoryDTO(String invoiceId, String invoiceNo, Date createdAt,
                             double total, List<ItemLine> items) {
    this.invoiceId = invoiceId;
    this.invoiceNo = invoiceNo;
    this.createdAt = createdAt;
    this.total = total;
    this.items = items;
  }

  public static class ItemLine {
    private String itemCode;
    private String description;
    private double qty;
    private double price;

    public ItemLine() {}

    public ItemLine(String itemCode, String description, double qty, double price) {
      this.itemCode = itemCode;
      this.description = description;
      this.qty = qty;
      this.price = price;
    }

    public String getItemCode()     { return itemCode; }
    public String getDescription()  { return description; }
    public double getQty()          { return qty; }
    public double getPrice()        { return price; }

    public void setItemCode(String itemCode)       { this.itemCode = itemCode; }
    public void setDescription(String description) { this.description = description; }
    public void setQty(double qty)                 { this.qty = qty; }
    public void setPrice(double price)             { this.price = price; }
  }

  public String getInvoiceId()    { return invoiceId; }
  public String getInvoiceNo()    { return invoiceNo; }
  public Date   getCreatedAt()    { return createdAt; }
  public double getTotal()        { return total; }
  public List<ItemLine> getItems(){ return items; }

  public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
  public void setInvoiceNo(String invoiceNo) { this.invoiceNo = invoiceNo; }
  public void setCreatedAt(Date createdAt)   { this.createdAt = createdAt; }
  public void setTotal(double total)         { this.total = total; }
  public void setItems(List<ItemLine> items) { this.items = items; }
}
