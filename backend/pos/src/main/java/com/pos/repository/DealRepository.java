// src/main/java/com/pos/repository/DealRepository.java
package com.pos.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.Deal;

@Repository
public interface DealRepository extends MongoRepository<Deal, String> {
  // Helpful for listing deals newest-first
  List<Deal> findAllByOrderByCreatedAtDesc();
}
