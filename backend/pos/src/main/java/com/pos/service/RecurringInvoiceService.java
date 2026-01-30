package com.pos.service;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.dto.RecurringHistoryDTO;                 // ✅ FIXED PACKAGE
import com.pos.model.Invoice;
import com.pos.model.RecurringInvoice;
import com.pos.model.RecurringInvoice.Frequency;
import com.pos.model.RecurringInvoice.Status;
import com.pos.repository.InvoiceRepository;
import com.pos.repository.RecurringInvoiceRepository;

@Service
public class RecurringInvoiceService {

    private final RecurringInvoiceRepository repo;
    private final InvoiceService invoiceService;     // creates invoices from template
    private final InvoiceRepository invoiceRepo;     // for history view

    public RecurringInvoiceService(RecurringInvoiceRepository repo,
                                   InvoiceService invoiceService,
                                   InvoiceRepository invoiceRepo) {
        this.repo = repo;
        this.invoiceService = invoiceService;
        this.invoiceRepo = invoiceRepo;
    }

    /* ===================== CRUD ===================== */

    public List<RecurringInvoice> findAll() {
        return repo.findAll();
    }

    public Optional<RecurringInvoice> findById(String id) {
        return repo.findById(id);
    }

    public RecurringInvoice create(RecurringInvoice r) {
        if (r.getInterval() <= 0) r.setInterval(1);
        if (r.getStatus() == null) r.setStatus(Status.ACTIVE);
        if (r.getStartDate() == null) r.setStartDate(LocalDate.now());
        if (r.getNextRunDate() == null) r.setNextRunDate(r.getStartDate());
        if (r.getInvoiceNoPrefix() == null || r.getInvoiceNoPrefix().isBlank()) {
            r.setInvoiceNoPrefix("RI-");
        }
        return repo.save(r);
    }

    public RecurringInvoice update(String id, RecurringInvoice u) {
        RecurringInvoice r = repo.findById(id).orElseThrow();
        r.setCustomerId(u.getCustomerId());
        r.setCustomerName(u.getCustomerName());
        r.setItems(u.getItems());
        r.setStartDate(u.getStartDate());
        r.setEndDate(u.getEndDate());
        r.setFrequency(u.getFrequency());
        r.setInterval(Math.max(1, u.getInterval()));
        r.setDayOfMonth(u.getDayOfMonth());
        r.setInvoiceNoPrefix(u.getInvoiceNoPrefix());
        r.setTimezone(u.getTimezone() != null ? u.getTimezone() : r.getTimezone());
        if (u.getNextRunDate() != null) r.setNextRunDate(u.getNextRunDate());
        return repo.save(r);
    }

    public void delete(String id) {
        repo.deleteById(id);
    }

    public RecurringInvoice pause(String id) {
        RecurringInvoice r = repo.findById(id).orElseThrow();
        r.setStatus(Status.PAUSED);
        return repo.save(r);
    }

    public RecurringInvoice resume(String id) {
        RecurringInvoice r = repo.findById(id).orElseThrow();
        r.setStatus(Status.ACTIVE);
        if (r.getNextRunDate() == null) r.setNextRunDate(LocalDate.now());
        return repo.save(r);
    }

    /* ===================== EXECUTION ===================== */

    /** Generate invoices for all ACTIVE templates due up to today, then advance nextRunDate. */
    public int runDueToday() {
        LocalDate today = LocalDate.now();
        List<RecurringInvoice> due = repo.findByStatusAndNextRunDateLessThanEqual(Status.ACTIVE, today);
        int count = 0;
        for (RecurringInvoice r : due) {
            if (r.getEndDate() != null && today.isAfter(r.getEndDate())) {
                r.setStatus(Status.ENDED);
                repo.save(r);
                continue;
            }
            generateInvoice(r);
            r.setLastRunDate(today);
            r.setNextRunDate(calcNextRunDate(r));
            repo.save(r);
            count++;
        }
        return count;
    }

    /** Manually trigger one template and advance its pointer. */
    public void runNow(String id) {
        RecurringInvoice r = repo.findById(id).orElseThrow();
        generateInvoice(r);
        LocalDate today = LocalDate.now();
        r.setLastRunDate(today);
        r.setNextRunDate(calcNextRunDate(r));
        repo.save(r);
    }

    /** Call your InvoiceService to create an Invoice from this template. */
    private void generateInvoice(RecurringInvoice r) {
        // Ensure InvoiceService.createFromRecurring(r) sets invoice.templateId = r.getId()
        invoiceService.createFromRecurring(r);
    }

    /** Compute the next run date based on frequency/interval/dayOfMonth. */
    private LocalDate calcNextRunDate(RecurringInvoice r) {
        LocalDate base = (r.getNextRunDate() != null ? r.getNextRunDate() : r.getStartDate());
        if (base == null) base = LocalDate.now();

        Frequency f = r.getFrequency();
        if (f == null) return base.plusDays(1);

        switch (f) {
            case DAILY:
                return base.plusDays(r.getInterval());
            case WEEKLY:
                return base.plusWeeks(r.getInterval());
            case MONTHLY:
                Integer dom = r.getDayOfMonth();
                if (dom != null) {
                    int safeDom = clamp(dom, 1, 28); // consistent across months
                    return base.plusMonths(r.getInterval()).withDayOfMonth(safeDom);
                }
                return base.plusMonths(r.getInterval());
            default:
                return base.plusDays(1);
        }
    }

    private static int clamp(int v, int min, int max) {
        return (v < min) ? min : ((v > max) ? max : v);
    }

    /* ===================== HISTORY (for UI) ===================== */

    /** Return last N invoices generated by this recurring template (for History view). */
    @Transactional(readOnly = true)
    public List<RecurringHistoryDTO> history(String templateId, int limit) {
        int size = (limit <= 0 || limit > 200) ? 50 : limit;

        List<Invoice> invoices = invoiceRepo
                .findByTemplateIdOrderByCreatedAtDesc(templateId, PageRequest.of(0, size));

        return invoices.stream()
            .map(inv -> new RecurringHistoryDTO(
                inv.getId(),
                inv.getInvoiceNo(),
                inv.getCreatedAt(),
                safeTotal(inv),  // net + vat (rounded)
                (inv.getItems() == null
                    ? Collections.<RecurringHistoryDTO.ItemLine>emptyList()
                    : inv.getItems().stream()
                        .map(this::toItemLine) // -> RecurringHistoryDTO.ItemLine
                        .collect(Collectors.toList()))
            ))
            .collect(Collectors.toList());
    }

    private static double safeTotal(Invoice inv) {
        double net = inv.getNetTotal();
        double vat = inv.getVat();
        return Math.round((net + vat) * 100.0) / 100.0;
    }

    // Reflection-safe item extractor (handles different field/getter names)
    private RecurringHistoryDTO.ItemLine toItemLine(Object line) {
        String code  = str(getAny(line, "getItemCode", "getCode", "getSku", "getItemId", "getId"));
        String desc  = str(getAny(line, "getDescription", "getName", "getItemName", "getTitle"));
        double qty   = dbl(getAny(line, "getQty", "getQuantity", "getQtyOrdered", "getCount", "getUnits"));
        double price = dbl(getAny(line, "getPrice", "getUnitPrice", "getRate", "getAmount"));

        return new RecurringHistoryDTO.ItemLine(
            safeString(code), safeString(desc), qty, price
        );
    }

    private static Object getAny(Object target, String... methodNames) {
        for (String m : methodNames) {
            try {
                Method method = target.getClass().getMethod(m);
                return method.invoke(target);
            } catch (ReflectiveOperationException ignored) {}
        }
        // fallback: try common public field names too
        for (String name : new String[]{
            "itemCode","code","sku","itemId","id",
            "description","name","itemName",
            "qty","quantity","qtyOrdered","count","units",
            "price","unitPrice","rate","amount"}) {
            try {
                return target.getClass().getField(name).get(target);
            } catch (ReflectiveOperationException ignored) {}
        }
        return null;
    }

    private static String str(Object o) { return (o == null) ? null : String.valueOf(o); }
    private static String safeString(String s) { return (s == null || s.trim().isEmpty()) ? "—" : s.trim(); }

    private static double dbl(Object o) {
        if (o == null) return 0.0;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
