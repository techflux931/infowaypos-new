// src/main/java/com/pos/repository/LedgerRepository.java
package com.pos.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Ledger;

public interface LedgerRepository extends MongoRepository<Ledger, String> {

  // search / validations you already had
  Page<Ledger> findByNameContainingIgnoreCase(String name, Pageable pageable);
  boolean existsByNameIgnoreCase(String name);

  // >>> needed for /api/ledgers/group/{groupId}
  List<Ledger> findByGroupId(String groupId);

  // (optional if you want paging on group filter too)
  Page<Ledger> findByGroupId(String groupId, Pageable pageable);
}
