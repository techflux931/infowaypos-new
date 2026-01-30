// src/main/java/com/pos/repository/ReturnTxnRepository.java
package com.pos.repository;

import com.pos.model.ReturnTxn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Date;
import java.util.List;

public interface ReturnTxnRepository extends MongoRepository<ReturnTxn, String> {

  // Common lookups
  List<ReturnTxn> findBySaleId(String saleId);
  List<ReturnTxn> findByCustomerId(String customerId);

  // Date-range queries
  List<ReturnTxn> findByDateBetween(Date from, Date to);
  Page<ReturnTxn> findByDateBetween(Date from, Date to, Pageable pageable);

  // Find returns that contain a specific product in any line
  @Query("{ 'items.productId': ?0 }")
  List<ReturnTxn> findByItemProductId(String productId);
}
