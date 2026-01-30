package com.pos.service;

import com.pos.model.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Date;
import java.util.Optional;

public interface SaleService {

    Page<Sale> search(
            String q,
            String customer,
            String paymentType,  // CASH | CARD | CREDIT
            String saleType,     // RETAIL | WHOLESALE | CREDIT
            Date from,
            Date to,
            Pageable pageable
    );

    Optional<Sale> findById(String id);

    Sale save(Sale sale);

    void deleteById(String id);
}
