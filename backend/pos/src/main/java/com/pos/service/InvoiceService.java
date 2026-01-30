package com.pos.service;

import java.util.List;

import com.pos.model.Invoice;
import com.pos.model.RecurringInvoice;

/**
 * Service for creating and managing invoices.
 */
public interface InvoiceService {

    /**
     * Create or update an invoice.
     * Implementation should:
     *  - fill missing fields (date, invoiceNo)
     *  - normalize items
     *  - compute net total + VAT
     *  - generate UAE e-invoice QR (eInvoiceQr)
     */
    Invoice saveInvoice(Invoice invoice);

    /**
     * Return all invoices.
     * (For production, prefer a paged/filter API.)
     */
    List<Invoice> getAllInvoices();

    /**
     * Load a single invoice by its MongoDB id.
     */
    Invoice getInvoiceById(String id);

    /**
     * Generate and persist a new invoice instance
     * derived from a recurring template.
     */
    Invoice createFromRecurring(RecurringInvoice template);
}
