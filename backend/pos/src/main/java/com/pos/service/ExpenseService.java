package com.pos.service;

import com.pos.dto.ExpenseRequest;
import com.pos.dto.ExpenseResponse;
import com.pos.model.Expense;
import com.pos.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ExpenseService {

    private final ExpenseRepository repo;

    public ExpenseService(ExpenseRepository repo) {
        this.repo = repo;
    }

    /* ---------- Converters ---------- */
    private static final ZoneId ZONE = ZoneId.systemDefault();

    private static LocalDate toLocalDate(Date d) {
        return d == null ? null : d.toInstant().atZone(ZONE).toLocalDate();
    }

    private static Date toDate(LocalDate d) {
        return d == null ? null : Date.from(d.atStartOfDay(ZONE).toInstant());
    }

    private static Instant toInstant(Date d) {
        return d == null ? null : d.toInstant();
    }

    /* ---------- Mapping ---------- */
    private static ExpenseResponse toDto(Expense e) {
        if (e == null) return null;

        ExpenseResponse.AddressDTO address = null;
        if (e.getAddress() != null) {
            address = new ExpenseResponse.AddressDTO();
            address.setStreet(e.getAddress().getStreet());
            address.setCity(e.getAddress().getCity());
            address.setState(e.getAddress().getState());
            address.setZip(e.getAddress().getZip());
            address.setCountry(e.getAddress().getCountry());
        }

        List<ExpenseResponse.AttachmentDTO> atts = null;
        if (e.getAttachments() != null) {
            atts = e.getAttachments().stream().map(a -> {
                ExpenseResponse.AttachmentDTO dto = new ExpenseResponse.AttachmentDTO();
                dto.setName(a.getName());
                dto.setSize(a.getSize());
                return dto;
            }).collect(Collectors.toList());
        }

        ExpenseResponse r = new ExpenseResponse();
        r.setId(e.getId());
        r.setName(e.getName());
        r.setCategory(e.getCategory());
        r.setVendor(e.getVendor());
        r.setAmount(e.getAmount());

        // entity -> DTO conversions
        r.setDate(toLocalDate(e.getDate()));          // LocalDate expected by DTO
        r.setPaymentMethod(e.getPaymentMethod());
        r.setDescription(e.getDescription());
        r.setAddress(address);
        r.setAttachments(atts);
        r.setCreatedAt(toInstant(e.getCreatedAt()));  // Instant expected by DTO
        r.setUpdatedAt(toInstant(e.getUpdatedAt()));
        return r;
    }

    private static Expense fromRequest(ExpenseRequest r) {
        if (r == null) return null;

        Expense e = new Expense();
        e.setName(StringUtils.hasText(r.getExpenseName()) ? r.getExpenseName().trim() : null);
        e.setCategory(StringUtils.hasText(r.getCategory()) ? r.getCategory().trim() : null);
        e.setVendor(StringUtils.hasText(r.getVendor()) ? r.getVendor().trim() : null);
        e.setAmount(r.getAmount());

        // DTO -> entity conversions
        e.setDate(toDate(r.getDate()));               // entity uses Date (if yours is LocalDate, this still compiles)
        e.setPaymentMethod(r.getPaymentMethod());
        e.setDescription(r.getDescription());

        if (r.getAddress() != null) {
            Expense.Address addr = new Expense.Address();
            addr.setStreet(r.getAddress().getStreet());
            addr.setCity(r.getAddress().getCity());
            addr.setState(r.getAddress().getState());
            addr.setZip(r.getAddress().getZip());
            addr.setCountry(r.getAddress().getCountry());
            e.setAddress(addr);
        } else {
            e.setAddress(null);
        }

        if (r.getAttachments() != null) {
            List<Expense.Attachment> list = new ArrayList<>();
            for (ExpenseRequest.AttachmentDTO a : r.getAttachments()) {
                Expense.Attachment att = new Expense.Attachment();
                att.setName(a.getName());
                att.setSize(a.getSize());
                list.add(att);
            }
            e.setAttachments(list);
        } else {
            e.setAttachments(null);
        }

        return e;
    }

    private static void apply(Expense e, ExpenseRequest r) {
        e.setName(StringUtils.hasText(r.getExpenseName()) ? r.getExpenseName().trim() : null);
        e.setCategory(StringUtils.hasText(r.getCategory()) ? r.getCategory().trim() : null);
        e.setVendor(StringUtils.hasText(r.getVendor()) ? r.getVendor().trim() : null);
        e.setAmount(r.getAmount());

        // DTO -> entity conversions
        e.setDate(toDate(r.getDate()));
        e.setPaymentMethod(r.getPaymentMethod());
        e.setDescription(r.getDescription());

        if (r.getAddress() != null) {
            Expense.Address addr = new Expense.Address();
            addr.setStreet(r.getAddress().getStreet());
            addr.setCity(r.getAddress().getCity());
            addr.setState(r.getAddress().getState());
            addr.setZip(r.getAddress().getZip());
            addr.setCountry(r.getAddress().getCountry());
            e.setAddress(addr);
        } else {
            e.setAddress(null);
        }

        if (r.getAttachments() != null) {
            List<Expense.Attachment> list = new ArrayList<>();
            for (ExpenseRequest.AttachmentDTO a : r.getAttachments()) {
                Expense.Attachment att = new Expense.Attachment();
                att.setName(a.getName());
                att.setSize(a.getSize());
                list.add(att);
            }
            e.setAttachments(list);
        } else {
            e.setAttachments(null);
        }
    }

    private static void requireValid(ExpenseRequest r) {
        if (r == null) throw new ResponseStatusException(BAD_REQUEST, "Request body is missing");
        if (!StringUtils.hasText(r.getExpenseName()))
            throw new ResponseStatusException(BAD_REQUEST, "Expense name is required");
        if (r.getAmount() == null || r.getAmount().signum() <= 0)
            throw new ResponseStatusException(BAD_REQUEST, "Amount must be greater than zero");
    }

    /* ---------- API ---------- */

    public List<ExpenseResponse> list(String search) {
        List<Expense> data;
        if (StringUtils.hasText(search)) {
            data = repo.findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrVendorContainingIgnoreCase(
                    search, search, search, org.springframework.data.domain.Pageable.unpaged()
            ).getContent();
        } else {
            data = repo.findAll();
        }
        return data.stream().map(ExpenseService::toDto).collect(Collectors.toList());
    }

    public ExpenseResponse get(String id) {
        Expense e = repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(NOT_FOUND, "Expense not found"));
        return toDto(e);
    }

    public ExpenseResponse create(ExpenseRequest req) {
        requireValid(req);
        Expense saved = repo.save(fromRequest(req));
        return toDto(saved);
    }

    public ExpenseResponse update(String id, ExpenseRequest req) {
        requireValid(req);
        Expense e = repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(NOT_FOUND, "Expense not found"));
        apply(e, req);
        return toDto(repo.save(e));
    }

    public void delete(String id) {
        if (!repo.existsById(id))
            throw new ResponseStatusException(NOT_FOUND, "Expense not found");
        repo.deleteById(id);
    }
}
