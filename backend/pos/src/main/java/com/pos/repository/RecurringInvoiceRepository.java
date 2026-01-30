// src/main/java/com/pos/repository/RecurringInvoiceRepository.java
package com.pos.repository;

import com.pos.model.RecurringInvoice;
import com.pos.model.RecurringInvoice.Status;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface RecurringInvoiceRepository extends MongoRepository<RecurringInvoice, String> {
  List<RecurringInvoice> findByStatusAndNextRunDateLessThanEqual(Status status, LocalDate date);
}
