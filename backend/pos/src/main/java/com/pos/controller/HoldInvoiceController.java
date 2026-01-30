// src/main/java/com/pos/controller/HoldInvoiceController.java
package com.pos.controller;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pos.model.HoldInvoice;
import com.pos.repository.HoldInvoiceRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pos/holds")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HoldInvoiceController {

    private final HoldInvoiceRepository repo;
    private final MongoTemplate mongo;

    /**
     * Lightweight list for Recall:
     * - optional q (serialNo or customer.name)
     * - optional from/to (ISO-8601 Instants)
     * - default sort: date desc
     * - limit (default 200)
     */
    @GetMapping
    public List<HoldInvoice> list(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to,
            @RequestParam(value = "limit", required = false, defaultValue = "200") int limit
    ) {
        int lim = Math.min(Math.max(limit, 1), 500);

        Query query = new Query();
        query.with(Sort.by(Sort.Direction.DESC, "date"));

        if (StringUtils.hasText(q)) {
            String rx = "(?i).*" + Pattern.quote(q.trim()) + ".*";
            query.addCriteria(new Criteria().orOperator(
                    where("serialNo").regex(rx),
                    where("customer.name").regex(rx)
            ));
        }

        if (from != null || to != null) {
            Criteria c = where("date");
            if (from != null && to != null) c.gte(from).lte(to);
            else if (from != null)          c.gte(from);
            else                            c.lte(to);
            query.addCriteria(c);
        }

        query.limit(lim);
        return mongo.find(query, HoldInvoice.class);
    }

    @GetMapping("/{id}")
    public HoldInvoice get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Hold invoice not found: " + id));
    }

    @PostMapping
    public HoldInvoice create(@RequestBody HoldInvoice req) {
        if (req.getDate() == null) req.setDate(Instant.now());
        req.setId(null); // ensure insert
        return repo.save(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        repo.deleteById(id);
    }
}
