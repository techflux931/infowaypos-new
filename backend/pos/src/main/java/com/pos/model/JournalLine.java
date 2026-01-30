package com.pos.model;

public class JournalLine {
  private String accountId;  // reference to an Account (or code)
  private Double debit;
  private Double credit;
  private String memo;

  public String getAccountId() { return accountId; }
  public Double getDebit() { return debit; }
  public Double getCredit() { return credit; }
  public String getMemo() { return memo; }

  public void setAccountId(String accountId) { this.accountId = accountId; }
  public void setDebit(Double debit) { this.debit = debit; }
  public void setCredit(Double credit) { this.credit = credit; }
  public void setMemo(String memo) { this.memo = memo; }
}
