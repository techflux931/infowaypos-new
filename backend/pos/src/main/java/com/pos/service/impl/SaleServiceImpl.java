package com.pos.service.impl;

import com.pos.model.Sale;
import com.pos.repository.SaleRepository;
import com.pos.service.SaleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Optional;

@Service
public class SaleServiceImpl implements SaleService {

    private final SaleRepository repo;

    public SaleServiceImpl(SaleRepository repo) {
        this.repo = repo;
    }

    @Override
    public Page<Sale> search(String q, String customer, String paymentType, String saleType,
                             Date from, Date to, Pageable pageable) {
        return repo.search(q, customer, paymentType, saleType, from, to, pageable);
    }

    @Override
    public Optional<Sale> findById(String id) {
        return repo.findById(id);
    }

    @Override
    public Sale save(Sale sale) {
        // defaults / normalization
        if (sale.getDate() == null) sale.setDate(new Date());

        if (sale.getPaymentType() == null || sale.getPaymentType().isBlank()) {
            sale.setPaymentType("CASH");
        } else {
            sale.setPaymentType(sale.getPaymentType().trim().toUpperCase());
        }

        if (sale.getSaleType() != null) {
            sale.setSaleType(sale.getSaleType().trim().toUpperCase()); // RETAIL/WHOLESALE/CREDIT
        }

        if (sale.getInvoiceNo() == null || sale.getInvoiceNo().isBlank()) {
            sale.setInvoiceNo("INV-" + System.currentTimeMillis());
        }

        if (sale.getGrossTotal() == null) sale.setGrossTotal(BigDecimal.ZERO);
        if (sale.getDiscount()   == null) sale.setDiscount(BigDecimal.ZERO);
        if (sale.getVat()        == null) sale.setVat(BigDecimal.ZERO);
        if (sale.getNetTotal()   == null) {
            sale.setNetTotal(sale.getGrossTotal().add(sale.getVat()).subtract(sale.getDiscount()));
        }
        if (sale.getReturnAmount() == null) sale.setReturnAmount(BigDecimal.ZERO);

        return repo.save(sale);
    }

    @Override
    public void deleteById(String id) {
        repo.deleteById(id);
    }
}
