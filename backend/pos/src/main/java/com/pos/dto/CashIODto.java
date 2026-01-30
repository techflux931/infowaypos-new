package com.pos.dto;

import java.math.BigDecimal;

/** Request body for /cash-in and /cash-out */
public class CashIODto {
  private BigDecimal amount;
  private String note;

  public CashIODto() { }                          // needed by Jackson

  public CashIODto(BigDecimal amount, String note) {
    this.amount = amount;
    this.note = note;
  }

  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }

  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
}
