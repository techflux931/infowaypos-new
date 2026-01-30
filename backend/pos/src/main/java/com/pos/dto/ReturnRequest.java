package com.pos.dto;

import java.util.List;

/**
 * Incoming return payload from the POS UI.
 * If {@code amount} is null, the server will sum {@code items[].amount}.
 * Approver fields are optional; include them to record who approved the return.
 */
public class ReturnRequest {

  private String saleId;
  private String customerId;
  private String customerName;
  private String reason;
  private Double amount; // optional; when null server sums items

  // OPTIONAL: who approved (manager/admin)
  private String approverId;
  private String approverName;
  private String approverUsername;

  private List<Item> items;

  // ---------- Nested ----------
  public static class Item {
    private String productId;
    private String name;
    private double qty;
    private double amount; // line amount

    public Item() {}

    public Item(String productId, String name, double qty, double amount) {
      this.productId = productId;
      this.name = name;
      this.qty = qty;
      this.amount = amount;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getQty() { return qty; }
    public void setQty(double qty) { this.qty = qty; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
  }

  // ---------- Getters/Setters ----------
  public String getSaleId() { return saleId; }
  public void setSaleId(String saleId) { this.saleId = saleId; }
  public String getCustomerId() { return customerId; }
  public void setCustomerId(String customerId) { this.customerId = customerId; }
  public String getCustomerName() { return customerName; }
  public void setCustomerName(String customerName) { this.customerName = customerName; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public Double getAmount() { return amount; }
  public void setAmount(Double amount) { this.amount = amount; }
  public List<Item> getItems() { return items; }
  public void setItems(List<Item> items) { this.items = items; }

  public String getApproverId() { return approverId; }
  public void setApproverId(String approverId) { this.approverId = approverId; }
  public String getApproverName() { return approverName; }
  public void setApproverName(String approverName) { this.approverName = approverName; }
  public String getApproverUsername() { return approverUsername; }
  public void setApproverUsername(String approverUsername) { this.approverUsername = approverUsername; }
}
