// src/main/java/com/pos/repository/SaleRepositoryCustom.java
package com.pos.repository;

import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.pos.model.Sale;

public interface SaleRepositoryCustom {
  Page<Sale> search(
      String q,
      String customer,
      String paymentType,
      String saleType,
      Date from,
      Date to,
      Pageable pageable
  );
}
