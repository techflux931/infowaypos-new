// src/main/java/com/pos/controller/LedgerController.java
package com.pos.controller;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.dto.LedgerRequest;
import com.pos.dto.LedgerRow;
import com.pos.model.AccountGroup;
import com.pos.model.BalanceType;
import com.pos.model.Ledger;
import com.pos.repository.AccountGroupRepository;
import com.pos.repository.LedgerRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/accounts/ledgers")
@CrossOrigin
public class LedgerController {

    private final LedgerRepository ledgers;
    private final AccountGroupRepository groups;

    public LedgerController(LedgerRepository ledgers, AccountGroupRepository groups) {
        this.ledgers = ledgers;
        this.groups = groups;
    }

    // ---------- LIST ----------
    @GetMapping
    public Page<LedgerRow> list(@RequestParam(defaultValue = "") String q,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Ledger> pg = (q == null || q.isBlank())
                ? ledgers.findAll(pageable)
                : ledgers.findByNameContainingIgnoreCase(q.trim(), pageable);

        // Batch resolve group names
        Set<String> groupIds = pg.stream()
                .map(Ledger::getGroupId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, String> groupNameById = groupIds.isEmpty()
                ? Collections.emptyMap()
                : groups.findAllById(groupIds).stream()
                        .collect(Collectors.toMap(AccountGroup::getId, AccountGroup::getName));

        return pg.map(l -> toRow(l, groupNameById.get(l.getGroupId())));
    }

    // ---------- CREATE ----------
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LedgerRow create(@Valid @RequestBody LedgerRequest req) {
        validateGroup(req.getGroupId());
        Ledger l = new Ledger();
        apply(req, l);
        l = ledgers.save(l);
        return toRow(l, resolveGroupName(l.getGroupId()));
    }

    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public LedgerRow update(@PathVariable String id, @Valid @RequestBody LedgerRequest req) {
        validateGroup(req.getGroupId());
        Ledger l = ledgers.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ledger not found: " + id));
        apply(req, l);
        l = ledgers.save(l);
        return toRow(l, resolveGroupName(l.getGroupId()));
    }

    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        ledgers.deleteById(id);
    }

    // ---------- helpers ----------
    private void apply(LedgerRequest req, Ledger l) {
        l.setName((req.getName() == null ? "" : req.getName()).trim());
        l.setGroupId(req.getGroupId());

        // Your DTO exposes BalanceType directly
        BalanceType bt = req.getType();
        l.setType(bt);

        // Your DTO openingBalance is primitive double (not nullable)
        l.setOpeningBalance(req.getOpeningBalance());

        l.setCostCenterApplicable(Boolean.TRUE.equals(req.getCostCenterApplicable()));
        l.setRemark(req.getRemark());
    }

    private void validateGroup(String groupId) {
        if (groupId == null || groupId.isBlank() || !groups.existsById(groupId)) {
            throw new IllegalArgumentException("Invalid groupId: " + groupId);
        }
    }

    private String resolveGroupName(String groupId) {
        if (groupId == null) return "-";
        return groups.findById(groupId).map(AccountGroup::getName).orElse("-");
    }

    private LedgerRow toRow(Ledger l, String groupName) {
        String bt = (l.getType() == null) ? null : l.getType().name();
        double ob = l.getOpeningBalance(); // primitive, no null checks

        return new LedgerRow(
                l.getId(),
                l.getName(),
                l.getGroupId(),
                (groupName == null || groupName.isBlank()) ? "-" : groupName,
                ob,                    // auto-boxes to Double if needed
                bt,
                l.isCostCenterApplicable(),
                l.getRemark()
        );
    }
}
