// src/main/java/com/pos/repository/HoldInvoiceRepository.java
package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.HoldInvoice;

@Repository
public interface HoldInvoiceRepository extends MongoRepository<HoldInvoice, String> { }
