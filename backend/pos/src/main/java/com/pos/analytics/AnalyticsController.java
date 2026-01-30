package com.pos.analytics;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.analytics.dto.InvoiceRow;
import com.pos.analytics.dto.PaymentSlice;
import com.pos.analytics.dto.SeriesPoint;
import com.pos.analytics.dto.SummaryDTO;
import com.pos.analytics.dto.TopProductDTO;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");

    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    /* -------------------- Summary -------------------- */
    @GetMapping("/summary")
    public SummaryDTO summary(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String p = normalizePeriod(period);
        LocalDate[] r = rangeOrDefault(from, to);
        return service.summary(p, r[0], r[1]);
    }

    /* -------- Sales vs Purchase (series) -------- */
    @GetMapping("/series/sales-vs-purchase")
    public List<SeriesPoint> salesVsPurchase(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String p = normalizePeriod(period);
        LocalDate[] r = rangeOrDefault(from, to);
        return service.salesVsPurchase(p, r[0], r[1]);
    }

    /* -------------------- Top Products -------------------- */
    @GetMapping("/top-products")
    public List<TopProductDTO> topProducts(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {

        String p = normalizePeriod(period);
        LocalDate[] r = rangeOrDefault(from, to);
        int lim = clamp(limit, 1, 50);
        return service.topProducts(p, r[0], r[1], lim);
    }

    /* -------------------- Recent Invoices -------------------- */
    @GetMapping("/recent-invoices")
    public List<InvoiceRow> recentInvoices(
            @RequestParam(defaultValue = "8") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        LocalDate[] r = rangeOrDefault(from, to);     // fills defaults when null
        int lim = clamp(limit, 1, 50);
        return service.recentInvoices(lim, r[0], r[1]);
    }

    /* -------------------- Payments Breakdown -------------------- */
    @GetMapping("/payments-breakdown")
    public List<PaymentSlice> paymentsBreakdown(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String p = normalizePeriod(period);
        LocalDate[] r = rangeOrDefault(from, to);
        return service.paymentsBreakdown(p, r[0], r[1]);
    }

    /* ==================== helpers ==================== */

    private static String normalizePeriod(String period) {
        if (period == null) return "daily";
        switch (period.toLowerCase()) {
            case "weekly":  return "weekly";
            case "monthly": return "monthly";
            default:        return "daily";
        }
    }

    /** Use first day of this month → today when from/to are null. Also ensures start <= end. */
    private static LocalDate[] rangeOrDefault(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate start = (from == null) ? today.withDayOfMonth(1) : from;
        LocalDate end   = (to   == null) ? today : to;
        if (end.isBefore(start)) {
            LocalDate tmp = start; start = end; end = tmp;
        }
        return new LocalDate[]{start, end};
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }
}
