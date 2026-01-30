package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "shifts")
public class Shift {
  @Id
  private String id;

  private Instant openedAt = Instant.now();
  private Instant closedAt;

  // store user ids (strings) instead of JPA @ManyToOne
  private String openedByUserId;
  private String closedByUserId;

  public String getId() { return id; }
  public Instant getOpenedAt() { return openedAt; }
  public Instant getClosedAt() { return closedAt; }
  public String getOpenedByUserId() { return openedByUserId; }
  public String getClosedByUserId() { return closedByUserId; }

  public void setId(String id) { this.id = id; }
  public void setOpenedAt(Instant openedAt) { this.openedAt = openedAt; }
  public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
  public void setOpenedByUserId(String openedByUserId) { this.openedByUserId = openedByUserId; }
  public void setClosedByUserId(String closedByUserId) { this.closedByUserId = closedByUserId; }
}
