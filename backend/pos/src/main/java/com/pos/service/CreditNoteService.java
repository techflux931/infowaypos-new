// src/main/java/com/pos/service/CreditNoteService.java
package com.pos.service;

import com.pos.dto.CreditNoteRequest;
import com.pos.model.CreditNote;
import com.pos.repository.CreditNoteRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CreditNoteService {

    private final CreditNoteRepository repo;

    public CreditNoteService(CreditNoteRepository repo) {
        this.repo = repo;
    }

    // ---------- helpers ----------
    private static BigDecimal nz(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private static boolean blank(String s){ return s == null || s.trim().isEmpty(); }
    private static boolean hasText(String s){ return s != null && !s.trim().isEmpty(); }
    private static BigDecimal s2(BigDecimal v){ return nz(v).setScale(2, RoundingMode.HALF_UP); }

    private static BigDecimal calcAmount(BigDecimal qty, BigDecimal rate, BigDecimal discPct) {
        qty = nz(qty);
        rate = nz(rate);
        discPct = nz(discPct);
        BigDecimal line = qty.multiply(rate);
        if (discPct.signum() > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(
                discPct.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
            );
            line = line.multiply(factor);
        }
        return s2(line);
    }

    /** Map request items -> entity items and (re)compute each line amount. */
    private static List<CreditNote.LineItem> mapItems(List<CreditNoteRequest.Item> in) {
        if (in == null) return List.of();
        return in.stream()
            // accept legacy "item" OR bilingual fields
            .filter(i -> hasText(i.getItem()) || hasText(i.getItemEn()) || hasText(i.getItemAr()))
            .map(i -> {
                CreditNote.LineItem x = new CreditNote.LineItem();

                // --- names (bilingual) ---
                String en = i.getItemEn();
                String ar = i.getItemAr();

                // If only legacy "item" provided, split "EN | AR"
                if (!hasText(en) && !hasText(ar) && hasText(i.getItem())) {
                    String[] parts = i.getItem().split("\\|", 2);
                    en = parts.length > 0 ? parts[0].trim() : "";
                    ar = parts.length > 1 ? parts[1].trim() : "";
                }

                x.setItemEn(hasText(en) ? en : null);
                x.setItemAr(hasText(ar) ? ar : null);

                // --- rest of fields ---
                x.setAccount(i.getAccount());
                x.setQuantity(nz(i.getQuantity()));
                x.setRate(nz(i.getRate()));
                x.setDiscount(nz(i.getDiscount()));

                // compute amount on server
                BigDecimal amt = i.getAmount();
                if (amt == null || BigDecimal.ZERO.compareTo(amt) == 0) {
                    amt = calcAmount(i.getQuantity(), i.getRate(), i.getDiscount());
                }
                x.setAmount(s2(amt));
                return x;
            })
            .toList();
    }

    /** Sum amounts from entity items. */
    private static BigDecimal sumAmounts(List<CreditNote.LineItem> items) {
        return s2(items.stream()
            .map(li -> nz(li.getAmount()))
            .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    /** If creditNoteNo is blank, generate a CN-YYYYMM-NNNN id. */
    private static String genCreditNoteNo(LocalDate date) {
        String yyyymm = String.format("%04d%02d", date.getYear(), date.getMonthValue());
        int seq = ThreadLocalRandom.current().nextInt(1, 10000);
        return String.format("CN-%s-%04d", yyyymm, seq);
    }

    // ---------- create ----------
    public CreditNote create(String user, CreditNoteRequest req, String status) {
        if (blank(req.getCustomerName())) {
            throw new IllegalArgumentException("customerName is required");
        }

        CreditNote n = new CreditNote();

        // party
        n.setCustomerId(req.getCustomerId());
        n.setCustomerName(req.getCustomerName().trim());

        // header
        LocalDate date = (req.getCreditNoteDate() != null) ? req.getCreditNoteDate() : LocalDate.now();
        n.setCreditNoteDate(date);

        String cn = blank(req.getCreditNoteNo()) ? genCreditNoteNo(date) : req.getCreditNoteNo().trim();
        n.setCreditNoteNo(cn);

        n.setReferenceNo(blank(req.getReferenceNo()) ? "-" : req.getReferenceNo().trim());
        n.setSalesperson(blank(req.getSalesperson()) ? "-" : req.getSalesperson().trim());
        n.setSubject(blank(req.getSubject()) ? null : req.getSubject().trim());

        // status
        n.setStatus(blank(status) ? "Draft" : status.trim());

        // items + totals (always recompute on server)
        List<CreditNote.LineItem> items = mapItems(req.getItems());
        n.setItems(items);

        BigDecimal subTotal = items.isEmpty() ? s2(nz(req.getSubTotal())) : sumAmounts(items);
        n.setSubTotal(subTotal);
        n.setTotal(subTotal);
        n.setAmount(n.getTotal());

        // audit
        n.setCreatedBy(blank(user) ? "system" : user);
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());

        return repo.save(n);
    }

    public CreditNote create(String user, CreditNoteRequest req) {
        return create(user, req, "Draft");
    }

    // ---------- update ----------
    public CreditNote update(String id, CreditNoteRequest req) {
        CreditNote n = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Credit note not found: " + id));

        if (!blank(req.getCustomerId())) n.setCustomerId(req.getCustomerId());
        if (!blank(req.getCustomerName())) n.setCustomerName(req.getCustomerName().trim());

        if (!blank(req.getCreditNoteNo())) n.setCreditNoteNo(req.getCreditNoteNo().trim());
        if (!blank(req.getReferenceNo())) n.setReferenceNo(req.getReferenceNo().trim());
        if (req.getCreditNoteDate() != null) n.setCreditNoteDate(req.getCreditNoteDate());
        if (!blank(req.getSalesperson())) n.setSalesperson(req.getSalesperson().trim());
        if (req.getSubject() != null) n.setSubject(blank(req.getSubject()) ? null : req.getSubject().trim());

        if (req.getItems() != null) {
            List<CreditNote.LineItem> items = mapItems(req.getItems());
            n.setItems(items);
            BigDecimal subTotal = items.isEmpty() ? s2(nz(req.getSubTotal())) : sumAmounts(items);
            n.setSubTotal(subTotal);
            n.setTotal(subTotal);
            n.setAmount(n.getTotal());
        }

        if (!blank(req.getInvoiceId())) n.setInvoiceId(req.getInvoiceId());

        n.setUpdatedAt(LocalDateTime.now());
        return repo.save(n);
    }

    // ---------- list (always oldest first) ----------
    public Page<CreditNote> list(String status, String q, PageRequest pageRequest) {
        // Force ASC order: createdAt, then creditNoteDate, then id
        Sort sort = Sort.by(Sort.Direction.ASC, "createdAt")
                        .and(Sort.by(Sort.Direction.ASC, "creditNoteDate"))
                        .and(Sort.by(Sort.Direction.ASC, "id"));

        PageRequest pr = PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize(), sort);

        String st = (status == null) ? null : status.trim();
        String qq = (q == null) ? null : q.trim();
        boolean hasStatus = st != null && !st.isEmpty();
        boolean hasQ = qq != null && !qq.isEmpty();

        if (hasStatus && hasQ) return repo.findByStatusIgnoreCaseAndCustomerNameContainingIgnoreCase(st, qq, pr);
        if (hasStatus)          return repo.findByStatusIgnoreCase(st, pr);
        if (hasQ)               return repo.findByCustomerNameContainingIgnoreCase(qq, pr);
        return repo.findAll(pr);
    }

    // ---------- get ----------
    public CreditNote get(String id) {
        return repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Credit note not found: " + id));
    }

    // ---------- delete ----------
    public void delete(String id) {
        if (!repo.existsById(id)) throw new NotFoundException("Credit note not found: " + id);
        repo.deleteById(id);
    }

    // ---------- set status ----------
    public CreditNote setStatus(String id, String status) {
        CreditNote n = get(id);
        n.setStatus(blank(status) ? n.getStatus() : status.trim());
        n.setUpdatedAt(LocalDateTime.now());
        return repo.save(n);
    }
}
