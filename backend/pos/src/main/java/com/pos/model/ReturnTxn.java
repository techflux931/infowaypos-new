package com.pos.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A POS return transaction, saved in Mongo collection "returns".
 * Stores the items returned and who approved the return.
 */
@Document(collection = "returns")
public class ReturnTxn {

  @Id
  private String id;

  /** When the return was recorded (server time). */
  private Date date = new Date();

  /** Optional reference to the original sale/invoice id. */
  private String saleId;

  /** Optional customer info. */
  private String customerId;
  private String customerName;

  /** Total refund amount for this return (sum of line amounts). */
  private double amount;

  /** Optional reason text (e.g., "POS line return"). */
  private String reason;

  /** The lines/items being returned. */
  private List<Item> items;

  /** Who approved this return (manager/admin). */
  private String approverId;        // user id
  private String approverName;      // display name (full name preferred)
  private String approverUsername;  // login/username

  // ---------- Constructors ----------
  public ReturnTxn() {}

  public ReturnTxn(
      String saleId,
      String customerId,
      String customerName,
      double amount,
      String reason,
      List<Item> items,
      String approverId,
      String approverName,
      String approverUsername) {
    this.saleId = saleId;
    this.customerId = customerId;
    this.customerName = customerName;
    this.amount = amount;
    this.reason = reason;
    this.items = items;
    this.approverId = approverId;
    this.approverName = approverName;
    this.approverUsername = approverUsername;
  }

  // ---------- Nested Item ----------
  public static class Item {
    private String productId;
    private String name;
    private double qty;     // quantity returned
    private double amount;  // line refund amount

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

  // ---------- Getters / Setters ----------
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public Date getDate() { return date; }
  public void setDate(Date date) { this.date = date; }

  public String getSaleId() { return saleId; }
  public void setSaleId(String saleId) { this.saleId = saleId; }

  public String getCustomerId() { return customerId; }
  public void setCustomerId(String customerId) { this.customerId = customerId; }

  public String getCustomerName() { return customerName; }
  public void setCustomerName(String customerName) { this.customerName = customerName; }

  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }

  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }

  public List<Item> getItems() { return items; }
  public void setItems(List<Item> items) { this.items = items; }

  public String getApproverId() { return approverId; }
  public void setApproverId(String approverId) { this.approverId = approverId; }

  public String getApproverName() { return approverName; }
  public void setApproverName(String approverName) { this.approverName = approverName; }

  public String getApproverUsername() { return approverUsername; }
  public void setApproverUsername(String approverUsername) { this.approverUsername = approverUsername; }
}
