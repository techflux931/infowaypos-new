package com.pos.service;

import com.pos.dto.GroupRequest;
import com.pos.dto.GroupRow;
import com.pos.dto.IdName;
import com.pos.model.AccountGroup;
import com.pos.model.AccountNature;
import com.pos.repository.AccountGroupRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AccountGroupService {

    private final AccountGroupRepository repo;

    public AccountGroupService(AccountGroupRepository repo) {
        this.repo = repo;
    }

    /* ----------------------- Queries ----------------------- */

    /** Table list: Page of lightweight rows with parent name resolved. */
    public Page<GroupRow> listRows(String q, int page, int size) {
        Pageable p = PageRequest.of(page, size, Sort.by("name").ascending());

        Page<AccountGroup> pg = (q == null || q.isBlank())
                ? repo.findAll(p)
                : repo.findByNameContainingIgnoreCase(q.trim(), p);

        // Collect the distinct parent ids from the current page (avoid N+1)
        Set<String> parentIds = pg.getContent().stream()
                .map(AccountGroup::getUnderAccountId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // id -> name map for parents that actually appear on this page
        Map<String, String> parentNameById = parentIds.isEmpty()
                ? Collections.emptyMap()
                : repo.findAllById(parentIds).stream()
                    .collect(Collectors.toMap(AccountGroup::getId, AccountGroup::getName));

        return pg.map(g -> toRow(g, parentNameById.get(g.getUnderAccountId())));
    }

    /** For dropdowns (id + name only, sorted by name). */
    public List<IdName> all() {
        return repo.findAll(Sort.by("name").ascending()).stream()
                .map(g -> new IdName(g.getId(), g.getName()))
                .toList(); // Java 16+
    }

    /* ----------------------- Commands ----------------------- */

    /** Create and return the saved row (with parent name). */
    public GroupRow create(GroupRequest req) {
        AccountGroup g = new AccountGroup();
        apply(req, g);
        g = repo.save(g);
        return toRow(g, resolveParentName(g.getUnderAccountId()));
    }

    /** Update and return the saved row (with parent name). */
    public GroupRow update(String id, GroupRequest req) {
        AccountGroup g = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));

        // Prevent self as parent
        if (req.getUnderAccountId() != null && req.getUnderAccountId().equals(id)) {
            throw new IllegalArgumentException("Under Account cannot be the same as this group.");
        }

        apply(req, g);
        g = repo.save(g);
        return toRow(g, resolveParentName(g.getUnderAccountId()));
    }

    public void delete(String id) {
        repo.deleteById(id);
    }

    /* ----------------------- Helpers ----------------------- */

    private void apply(GroupRequest req, AccountGroup g) {
        g.setName((req.getName() == null ? "" : req.getName()).trim());
        // Mongo id or null for root
        g.setUnderAccountId(req.getUnderAccountId());
        // Map "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" -> enum
        g.setNature(AccountNature.valueOf(req.getNature()));
        g.setAffectGrossProfit(Boolean.TRUE.equals(req.getAffectGrossProfit()));
        g.setRemarks(req.getRemarks());
    }

    private String resolveParentName(String parentId) {
        if (parentId == null || parentId.isBlank()) return "-";
        return repo.findById(parentId).map(AccountGroup::getName).orElse("-");
    }

    /** Map entity -> transport row. Note: boolean getter is *is*AffectGrossProfit(). */
    private GroupRow toRow(AccountGroup g, String parentName) {
        return new GroupRow(
                g.getId(),
                g.getName(),
                g.getUnderAccountId(),
                (parentName == null || parentName.isBlank()) ? "-" : parentName,
                g.getNature().name(),
                g.isAffectGrossProfit(),
                g.getRemarks()
        );
    }
}
