package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "journals")
public class Journal {
  @Id
  private String id;

  private Instant createdAt = Instant.now();
  private String type;              // e.g. RECEIPT, PAYMENT, GENERAL, ...
  private String note;
  private List<JournalLine> lines = new ArrayList<>();

  public String getId() { return id; }
  public Instant getCreatedAt() { return createdAt; }
  public String getType() { return type; }
  public String getNote() { return note; }
  public List<JournalLine> getLines() { return lines; }

  public void setId(String id) { this.id = id; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public void setType(String type) { this.type = type; }
  public void setNote(String note) { this.note = note; }
  public void setLines(List<JournalLine> lines) { this.lines = lines; }
}
