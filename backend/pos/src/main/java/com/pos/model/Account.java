package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "accounts")
public class Account {
  @Id
  private String id;

  private String code;            // ACC-001, etc.
  private String name;            // Ledger name
  private String type;            // e.g., "DEBIT" / "CREDIT"
  private String groupRefId;      // references AccountGroupRef.id
  private String notes;
}
