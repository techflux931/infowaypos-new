// src/main/java/com/pos/service/LedgerService.java
package com.pos.service;

import com.pos.dto.LedgerDTO;
import com.pos.model.LedgerEntry;
import com.pos.repository.LedgerEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LedgerService {

    private final LedgerEntryRepository repo;

    public LedgerService(LedgerEntryRepository repo) {
        this.repo = repo;
    }

    /** Get all entries (consider pagination later if this grows large). */
    public List<LedgerDTO> list() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    /** Get one by id (throws 400 if not found). */
    public LedgerDTO get(String id) {
        LedgerEntry e = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ledger entry not found: " + id));
        return toDto(e);
    }

    /** Create or update (if dto.id present). */
    @Transactional
    public LedgerDTO save(LedgerDTO dto) {
        LedgerEntry e = (dto.getId() != null && !dto.getId().isBlank())
                ? repo.findById(dto.getId()).orElse(new LedgerEntry())
                : new LedgerEntry();

        apply(dto, e);
        return toDto(repo.save(e));
    }

    @Transactional
    public void delete(String id) {
        repo.deleteById(id);
    }

    // ---------- mapping ----------
    private void apply(LedgerDTO dto, LedgerEntry e) {
        e.setEntityType(dto.getEntityType());
        e.setEntityId(dto.getEntityId());
        e.setEntityName(dto.getEntityName());
        e.setRefType(dto.getRefType());
        e.setRefId(dto.getRefId());
        e.setDate(dto.getDate());

        // Null-safe money fields (avoid NPEs in math/queries)
        BigDecimal debit  = dto.getDebit()  == null ? BigDecimal.ZERO : dto.getDebit();
        BigDecimal credit = dto.getCredit() == null ? BigDecimal.ZERO : dto.getCredit();
        e.setDebit(debit);
        e.setCredit(credit);

        e.setNotes(dto.getNotes());
    }

    private LedgerDTO toDto(LedgerEntry e) {
        LedgerDTO dto = new LedgerDTO();
        dto.setId(e.getId());
        dto.setEntityType(e.getEntityType());
        dto.setEntityId(e.getEntityId());
        dto.setEntityName(e.getEntityName());
        dto.setRefType(e.getRefType());
        dto.setRefId(e.getRefId());
        dto.setDate(e.getDate());
        dto.setDebit(e.getDebit());
        dto.setCredit(e.getCredit());
        dto.setNotes(e.getNotes());
        return dto;
    }
}
