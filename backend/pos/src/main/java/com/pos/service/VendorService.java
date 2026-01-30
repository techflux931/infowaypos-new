package com.pos.service;

import com.pos.dto.PageResponse;
import com.pos.dto.VendorRequest;
import com.pos.dto.VendorResponse;
import com.pos.model.Contact;
import com.pos.model.Vendor;
import com.pos.repository.VendorRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class VendorService {

    private static final String NOT_FOUND = "Vendor not found";
    private static final int MAX_PAGE_SIZE = 200;

    private final VendorRepository repo;

    public VendorService(VendorRepository repo) { this.repo = repo; }

    /* ------------------- CRUD ------------------- */

    @Transactional
    public VendorResponse create(VendorRequest req) {
        String code = trim(req.getCode());
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("Vendor code is required");
        }
        if (repo.existsByCode(code)) {
            throw new DuplicateKeyException("Vendor code already exists");
        }
        Vendor saved = repo.save(apply(req, new Vendor()));
        return toResponse(saved);
    }

    @Transactional
    public VendorResponse update(String id, VendorRequest req) {
        Vendor v = repo.findById(id).orElseThrow(() -> new IllegalArgumentException(NOT_FOUND));
        String newCode = trim(req.getCode());
        if (!StringUtils.hasText(newCode)) {
            throw new IllegalArgumentException("Vendor code is required");
        }
        if (!newCode.equals(v.getCode()) && repo.existsByCode(newCode)) {
            throw new DuplicateKeyException("Vendor code already exists");
        }
        Vendor saved = repo.save(apply(req, v));
        return toResponse(saved);
    }

    @Transactional
    public void delete(String id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException(NOT_FOUND);
        repo.deleteById(id);
    }

    public VendorResponse get(String id) {
        return repo.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException(NOT_FOUND));
    }

    public PageResponse<VendorResponse> list(String q, int page, int size, String sortBy, String dir) {
        int pageSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        Sort sort = Sort.by(StringUtils.hasText(sortBy) ? sortBy : "createdAt");
        sort = "asc".equalsIgnoreCase(dir) ? sort.ascending() : sort.descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), pageSize, sort);

        Page<Vendor> pg = StringUtils.hasText(q)
                ? repo.findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(q, q, pageable)
                : repo.findAll(pageable);

        List<VendorResponse> content = pg.getContent().stream()
                .map(this::toResponse)
                .toList();

        // Build PageResponse via setters (no ctor args needed)
        PageResponse<VendorResponse> resp = new PageResponse<>();
        resp.setContent(content);
        resp.setTotalElements(pg.getTotalElements());
        resp.setTotalPages(pg.getTotalPages());
        resp.setPage(pg.getNumber());
        resp.setSize(pg.getSize());
        resp.setLast(pg.isLast());
        return resp;
    }

    @Transactional
    public VendorResponse toggleActive(String id, boolean value) {
        Vendor v = repo.findById(id).orElseThrow(() -> new IllegalArgumentException(NOT_FOUND));
        v.setActive(value);
        return toResponse(repo.save(v));
    }

    /* ------------------- mapping ------------------- */

    private Vendor apply(VendorRequest req, Vendor v) {
        // Core fields (trimmed)
        v.setCode(trim(req.getCode()));
        v.setName(trim(req.getName()));
        v.setDisplayName(trim(req.getDisplayName()));
        v.setContactPerson(trim(req.getContactPerson()));
        v.setEmail(trim(req.getEmail()));
        v.setPhone(trim(req.getPhone()));
        v.setWhatsapp(trim(req.getWhatsapp()));
        v.setWebsite(trim(req.getWebsite()));
        v.setTrn(trim(req.getTrn()));
        v.setCategory(trim(req.getCategory()));
        v.setPaymentTerms(trim(req.getPaymentTerms()));
        v.setCreditLimit(req.getCreditLimit());
        v.setOpeningBalance(req.getOpeningBalance());
        v.setNotes(trim(req.getNotes()));

        // default active=true when null
        Boolean active = req.getActive();
        v.setActive(active == null || active);

        // Address as-is (assumed structured DTO)
        v.setAddress(req.getAddress());

        // Contacts: keep original order (FIFO) and drop empty rows
        List<Contact> cleaned = (req.getContacts() == null) ? List.of()
                : req.getContacts().stream()
                    .filter(c ->
                        StringUtils.hasText(trim(c.getName())) ||
                        StringUtils.hasText(trim(c.getPhone())) ||
                        StringUtils.hasText(trim(c.getEmail()))
                    )
                    .toList();
        v.setContacts(cleaned);

        // If no contactPerson set, pick primary contact, else first contact (FIFO)
        if (!StringUtils.hasText(v.getContactPerson())) {
            Contact primary = cleaned.stream().filter(Contact::isPrimary).findFirst()
                    .orElseGet(() -> cleaned.isEmpty() ? null : cleaned.get(0));
            if (primary != null) v.setContactPerson(primary.getName());
        }
        return v;
    }

    private VendorResponse toResponse(Vendor v) {
        VendorResponse r = new VendorResponse();
        r.setId(v.getId());
        r.setCode(v.getCode());
        r.setName(v.getName());
        r.setDisplayName(v.getDisplayName());
        r.setContactPerson(v.getContactPerson());
        r.setEmail(v.getEmail());
        r.setPhone(v.getPhone());
        r.setWhatsapp(v.getWhatsapp());
        r.setWebsite(v.getWebsite());
        r.setTrn(v.getTrn());
        r.setCategory(v.getCategory());
        r.setPaymentTerms(v.getPaymentTerms());
        r.setCreditLimit(v.getCreditLimit());
        r.setOpeningBalance(v.getOpeningBalance());
        r.setNotes(v.getNotes());
        r.setActive(v.isActive());
        r.setAddress(v.getAddress());
        r.setContacts(v.getContacts());
        r.setCreatedAt(v.getCreatedAt());
        r.setUpdatedAt(v.getUpdatedAt());
        return r;
    }

    /* ------------------- helpers ------------------- */

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}
