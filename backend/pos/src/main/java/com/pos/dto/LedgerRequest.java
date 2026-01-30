package com.pos.dto;

import com.pos.model.BalanceType;

import lombok.Data;

@Data
public class LedgerRequest {
  private String name;
  private String groupId;
  private BalanceType type;        // DEBIT / CREDIT
  private double openingBalance;
  private Boolean costCenterApplicable;
  private String remark;
}
