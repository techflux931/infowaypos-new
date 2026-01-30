package com.pos.dto;

import java.math.BigDecimal;

/** Response object for /cash-totals */
public class CashTotalsDto {
  private BigDecimal cashIn;
  private BigDecimal cashOut;
  private BigDecimal net;

  public CashTotalsDto() {}

  public CashTotalsDto(BigDecimal cashIn, BigDecimal cashOut, BigDecimal net) {
    this.cashIn = cashIn;
    this.cashOut = cashOut;
    this.net = net;
  }

  public BigDecimal getCashIn() { return cashIn; }
  public void setCashIn(BigDecimal cashIn) { this.cashIn = cashIn; }

  public BigDecimal getCashOut() { return cashOut; }
  public void setCashOut(BigDecimal cashOut) { this.cashOut = cashOut; }

  public BigDecimal getNet() { return net; }
  public void setNet(BigDecimal net) { this.net = net; }
}
