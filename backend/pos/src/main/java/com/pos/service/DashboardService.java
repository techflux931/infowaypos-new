// src/main/java/com/pos/service/DashboardService.java
package com.pos.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pos.dto.dashboard.DashboardMetricsDTO;
import com.pos.dto.dashboard.TopProductDTO;
import com.pos.dto.dashboard.WeeklyPointDTO;
import com.pos.repository.ExpenseRepository;
import com.pos.repository.PurchaseRepository;
import com.pos.repository.PurchaseReturnRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.SaleReturnRepository;

@Service
public class DashboardService {

  private final SaleRepository saleRepo;
  private final PurchaseRepository purchaseRepo;
  private final ExpenseRepository expenseRepo;
  private final SaleReturnRepository saleReturnRepo;
  private final PurchaseReturnRepository purchaseReturnRepo;

  /** Business timezone (UAE). Change if needed. */
  private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");
  private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  public DashboardService(
      SaleRepository saleRepo,
      PurchaseRepository purchaseRepo,
      ExpenseRepository expenseRepo,
      SaleReturnRepository saleReturnRepo,
      PurchaseReturnRepository purchaseReturnRepo
  ) {
    this.saleRepo = saleRepo;
    this.purchaseRepo = purchaseRepo;
    this.expenseRepo = expenseRepo;
    this.saleReturnRepo = saleReturnRepo;
    this.purchaseReturnRepo = purchaseReturnRepo;
  }

  /* =============================== KPI CARDS =============================== */

  public DashboardMetricsDTO getMetrics() {
    // [today 00:00, tomorrow 00:00) in Asia/Dubai
    final LocalDate today = LocalDate.now(ZONE);
    final Instant fromI = today.atStartOfDay(ZONE).toInstant();
    final Instant toI   = today.plusDays(1).atStartOfDay(ZONE).toInstant();
    final Date from = Date.from(fromI);
    final Date to   = Date.from(toI);

    final double salesAll           = nz(saleRepo.sumNetTotalAll());
    final double purchasesAll       = nz(purchaseRepo.sumGrandTotalAll());
    final double salesReturnsAll    = nz(saleReturnRepo.sumGrandTotalAll());
    final double purchaseReturnsAll = nz(purchaseReturnRepo.sumGrandTotalAll());

    final double todaySales      = nz(saleRepo.sumNetTotalBetween(from, to));
    final double todayPurchases  = nz(purchaseRepo.sumGrandTotalBetween(from, to));
    final double todayExpenses   = nz(expenseRepo.sumAmountBetween(from, to));

    // If you have separate amountReceived repo, swap this line.
    final double todayReceived   = todaySales;

    DashboardMetricsDTO dto = new DashboardMetricsDTO();
    dto.setSales(salesAll);
    dto.setPurchases(purchasesAll);
    dto.setSalesReturns(salesReturnsAll);
    dto.setPurchaseReturns(purchaseReturnsAll);
    dto.setTodayTotalSales(todaySales);
    dto.setTodayReceivedSales(todayReceived);
    dto.setTodayTotalPurchases(todayPurchases);
    dto.setTodayTotalExpenses(todayExpenses);
    return dto;
  }

  /* ============================= WEEKLY BAR DATA ============================= */

  public List<WeeklyPointDTO> getWeekly(int days) {
    final int d = Math.max(1, days);

    final LocalDate endInclusive = LocalDate.now(ZONE);     // today
    final LocalDate start        = endInclusive.minusDays(d - 1);

    final Date from       = Date.from(start.atStartOfDay(ZONE).toInstant());
    final Date toExclusive= Date.from(endInclusive.plusDays(1).atStartOfDay(ZONE).toInstant());

    // sales per day
    final Map<String, Double> salesByDate = new HashMap<>();
    for (SaleRepository.DailyTotal row : safeList(saleRepo.dailyNetTotalBetween(from, toExclusive))) {
      salesByDate.put(row.getDate(), nz(row.getTotal()));
    }

    // purchases per day
    final Map<String, Double> purchaseByDate = new HashMap<>();
    for (PurchaseRepository.DailyTotal row : safeList(purchaseRepo.dailyGrandTotalBetween(from, toExclusive))) {
      purchaseByDate.put(row.getDate(), nz(row.getTotal()));
    }

    // continuous series (no gaps)
    final List<WeeklyPointDTO> out = new ArrayList<>(d);
    for (LocalDate cur = start; !cur.isAfter(endInclusive); cur = cur.plusDays(1)) {
      final String key = cur.format(DAY_FMT);
      out.add(new WeeklyPointDTO(
          key,
          salesByDate.getOrDefault(key, 0d),
          purchaseByDate.getOrDefault(key, 0d)
      ));
    }
    return out;
  }

  /* ============================= TOP PRODUCTS PIE ============================ */

  public List<TopProductDTO> getTopProducts(int limit) {
    final int lim = Math.max(1, Math.min(20, limit));
    try {
      var rows = saleRepo.topProducts(lim);
      if (rows == null || rows.isEmpty()) return List.of();
      return rows.stream()
          .map(r -> new TopProductDTO(r.getName(), nz(r.getValue())))
          .collect(Collectors.toList());
    } catch (Exception e) {
      // never leak exceptions to the client; return empty list for safety
      return List.of();
    }
  }

  /* ================================= helpers ================================= */

  private static double nz(Double d) {
    if (d == null) return 0.0;
    if (d.isNaN() || d.isInfinite()) return 0.0;
    return d;
  }

  private static <T> List<T> safeList(List<T> list) {
    return (list == null) ? List.of() : list;
  }
}
