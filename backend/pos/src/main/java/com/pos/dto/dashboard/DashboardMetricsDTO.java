// src/main/java/com/pos/dto/dashboard/DashboardMetricsDTO.java
package com.pos.dto.dashboard;

import lombok.Data;

@Data
public class DashboardMetricsDTO {
  private double sales;
  private double purchases;
  private double salesReturns;
  private double purchaseReturns;
  private double todayTotalSales;
  private double todayReceivedSales;
  private double todayTotalPurchases;
  private double todayTotalExpenses;
}
