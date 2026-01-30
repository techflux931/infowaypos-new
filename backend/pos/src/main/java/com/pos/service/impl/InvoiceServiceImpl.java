package com.pos.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.pos.model.Invoice;
import com.pos.model.InvoiceItem;
import com.pos.model.RecurringInvoice;
import com.pos.model.SaleItem;
import com.pos.repository.InvoiceRepository;
import com.pos.service.InvoiceService;
import com.pos.util.UaeEInvoiceQrUtil;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;

    // TODO: later read these from Company / Shop settings instead of constants
    private static final String DEFAULT_SELLER_NAME = "JABAL AL RAHMAH GROCERY L.L.C";
    private static final String DEFAULT_TRN = "12002000000";

    public InvoiceServiceImpl(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    // =====================================================================
    // Public API
    // =====================================================================

    @Override
    public Invoice saveInvoice(Invoice invoice) {
        Objects.requireNonNull(invoice, "Invoice must not be null");

        // 1) Ensure date
        if (invoice.getDate() == null) {
            invoice.setDate(new Date());
        }

        // 2) Ensure invoice number
        if (isBlank(invoice.getInvoiceNo())) {
            invoice.setInvoiceNo(generateInvoiceNo("INV-"));
        }

        // 3) Normalize items and totals
        normalizeItems(invoice);

        double net = computeNet(invoice.getItems());
        double vat = round2(net * 0.05); // 5% VAT (UAE)

        invoice.setNetTotal(net);
        invoice.setVat(vat);

        // 4) FTA QR seller details
        if (isBlank(invoice.getSellerName())) {
            invoice.setSellerName(DEFAULT_SELLER_NAME);
        }
        if (isBlank(invoice.getTrn())) {
            invoice.setTrn(DEFAULT_TRN);
        }

        // 5) Build UAE e-invoice QR payload (Base64 TLV)
        String qr = buildEInvoiceQr(invoice);
        invoice.setEInvoiceQr(qr);

        // 6) Persist
        return invoiceRepository.save(invoice);
    }

    @Override
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @Override
    public Invoice getInvoiceById(String id) {
        return invoiceRepository.findById(id).orElse(null);
    }

    @Override
    public Invoice createFromRecurring(RecurringInvoice src) {
        Objects.requireNonNull(src, "Recurring template must not be null");

        // Map SaleItem -> InvoiceItem
        List<InvoiceItem> items = new ArrayList<>();
        double net = 0.0;

        if (src.getItems() != null) {
            for (SaleItem si : src.getItems()) {
                if (si == null) {
                    continue;
                }

                InvoiceItem ii = new InvoiceItem();
                ii.setNameEn(si.getName());
                ii.setNameAr(si.getNameAr());

                // NOTE: quantity is int in InvoiceItem.
                // If you need 1.25 kg, later change quantity to double.
                int qtyInt = (int) Math.round(si.getQuantity());
                ii.setQuantity(qtyInt);
                ii.setPrice(round2(si.getPrice()));
                ii.recalc(); // total = qty * price

                items.add(ii);
                net += qtyInt * round2(si.getPrice());
            }
        }

        Invoice inv = new Invoice();

        String prefix = isBlank(src.getInvoiceNoPrefix()) ? "INV-" : src.getInvoiceNoPrefix();
        inv.setInvoiceNo(generateInvoiceNo(prefix));

        inv.setDate(new Date());
        inv.setCustomerName(src.getCustomerName());
        // If RecurringInvoice has phone field, map it here
        // inv.setCustomerPhone(src.getCustomerPhone());
        inv.setPaymentType("CREDIT"); // sensible default for recurring invoices
        inv.setItems(items);

        double netRounded = round2(net);
        double vat = round2(netRounded * 0.05);

        inv.setNetTotal(netRounded);
        inv.setVat(vat);

        // Seller + TRN for QR
        inv.setSellerName(DEFAULT_SELLER_NAME);
        inv.setTrn(DEFAULT_TRN);

        // Build QR
        String qr = buildEInvoiceQr(inv);
        inv.setEInvoiceQr(qr);

        return invoiceRepository.save(inv);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private void normalizeItems(Invoice invoice) {
        List<InvoiceItem> items = invoice.getItems();
        if (items == null) {
            invoice.setItems(new ArrayList<>());
            return;
        }

        for (InvoiceItem it : items) {
            if (it == null) {
                continue;
            }
            // clamp negative values and recalc
            it.setQuantity(Math.max(0, it.getQuantity()));
            it.setPrice(Math.max(0, it.getPrice()));
            it.recalc();
        }
    }

    private double computeNet(List<InvoiceItem> items) {
        if (items == null) {
            return 0.0;
        }
        double sum = 0.0;
        for (InvoiceItem it : items) {
            if (it == null) {
                continue;
            }
            sum += it.getQuantity() * it.getPrice();
        }
        return round2(sum);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private String generateInvoiceNo(String prefix) {
        LocalDateTime now = LocalDateTime.now();
        String stamp = String.format(
                "%04d%02d%02d-%02d%02d%02d",
                now.getYear(),
                now.getMonthValue(),
                now.getDayOfMonth(),
                now.getHour(),
                now.getMinute(),
                now.getSecond()
        );
        return (prefix == null ? "INV-" : prefix) + stamp;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /**
     * Build UAE e-invoice QR payload using Invoice data.
     * Uses:
     *  - sellerName
     *  - trn
     *  - date (ISO-8601)
     *  - netTotal (incl. VAT)
     *  - vat
     */
    private String buildEInvoiceQr(Invoice invoice) {
        if (invoice.getDate() == null) {
            invoice.setDate(new Date());
        }

        String isoDateTime = invoice.getDate().toInstant().toString();
        double total = invoice.getNetTotal(); // grand total including VAT
        double vat = invoice.getVat();

        return UaeEInvoiceQrUtil.buildQrPayload(
                invoice.getSellerName(),
                invoice.getTrn(),
                isoDateTime,
                total,
                vat
        );
    }
}
