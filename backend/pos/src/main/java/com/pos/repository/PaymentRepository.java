// src/main/java/com/pos/repository/PaymentRepository.java
package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Payment;

public interface PaymentRepository extends MongoRepository<Payment, String> {
  // dynamic filters are handled in PaymentService via MongoTemplate
}
