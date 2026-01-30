package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "payments")
public class PaymentTxn {
  @Id
  private String id;

  private Date date;            // used by reports
  private String entityType;    // "CUSTOMER" or "VENDOR"
  private String entityId;
  private String entityName;
  private String method;        // Cash / Card / Transfer / etc.
  private double amount;        // report sums this
  private String referenceNo;   // optional
  private String notes;         // optional

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Date getDate() { return date; }
  public void setDate(Date date) { this.date = date; }
  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public String getEntityName() { return entityName; }
  public void setEntityName(String entityName) { this.entityName = entityName; }
  public String getMethod() { return method; }
  public void setMethod(String method) { this.method = method; }
  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }
  public String getReferenceNo() { return referenceNo; }
  public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }
}
