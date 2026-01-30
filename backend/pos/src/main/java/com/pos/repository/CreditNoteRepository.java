// src/main/java/com/pos/repository/CreditNoteRepository.java
package com.pos.repository;

import com.pos.model.CreditNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CreditNoteRepository extends MongoRepository<CreditNote, String> {

    Page<CreditNote> findByStatusIgnoreCase(String status, Pageable pageable);

    Page<CreditNote> findByCustomerNameContainingIgnoreCase(String q, Pageable pageable);

    Page<CreditNote> findByStatusIgnoreCaseAndCustomerNameContainingIgnoreCase(
            String status, String q, Pageable pageable
    );
}
