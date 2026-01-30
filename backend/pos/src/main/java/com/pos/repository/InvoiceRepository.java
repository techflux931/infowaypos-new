package com.pos.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.Invoice;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {

    /**
     * Fetch invoices linked to a recurring template,
     * ordered by newest first.
     */
    List<Invoice> findByTemplateIdOrderByCreatedAtDesc(String templateId, Pageable pageable);

    /**
     * Find invoice by invoice number (for search, reprint, recall).
     */
    Optional<Invoice> findByInvoiceNo(String invoiceNo);

    /**
     * List invoices by customer name (useful for customer history).
     */
    List<Invoice> findByCustomerNameOrderByDateDesc(String customerName, Pageable pageable);

    /**
     * Search by date range.
     */
    List<Invoice> findByDateBetweenOrderByDateDesc(
            java.util.Date from,
            java.util.Date to,
            Pageable pageable
    );

    /**
     * Get latest invoices (POS View Sales).
     */
    List<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
