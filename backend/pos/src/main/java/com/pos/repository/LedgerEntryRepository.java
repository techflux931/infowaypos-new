// src/main/java/com/pos/repository/LedgerEntryRepository.java
package com.pos.repository;

import com.pos.model.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;

public interface LedgerEntryRepository extends MongoRepository<LedgerEntry, String> {

    // Per-party ledger (customer/vendor) pages
    Page<LedgerEntry> findByEntityId(String entityId, Pageable pageable);

    Page<LedgerEntry> findByEntityTypeAndEntityId(
            LedgerEntry.EntityType entityType,
            String entityId,
            Pageable pageable
    );

    // Date filters (adjust as needed)
    Page<LedgerEntry> findByEntityIdAndDateBetween(
            String entityId,
            LocalDate from,
            LocalDate to,
            Pageable pageable
    );
}
