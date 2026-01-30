package com.pos.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("ledgers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ledger {
  @Id private String id;

  private String name;
  private String groupId;                 // FK to AccountGroup (string id)
  private BalanceType type;               // DEBIT or CREDIT
  private double openingBalance;
  private boolean costCenterApplicable;
  private String remark;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
