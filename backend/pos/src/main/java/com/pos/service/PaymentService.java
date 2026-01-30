// src/main/java/com/pos/service/PaymentService.java
package com.pos.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.pos.model.Payment;
import com.pos.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

  private final PaymentRepository repo;
  private final MongoTemplate mongo;

  public Payment save(Payment p) {
    // default to "now" if UI forgot the date
    if (p.getDate() == null) p.setDate(Instant.now());
    return repo.save(p);
  }

  public List<Payment> search(String search, String type, Instant from, Instant to) {
    // normalize date range
    if (from != null && to != null && from.isAfter(to)) {
      Instant tmp = from; from = to; to = tmp;
    }

    List<Criteria> filters = new ArrayList<>();

    if (search != null && !search.isBlank()) {
      String rx = ".*" + escapeRegex(search.trim()) + ".*";
      filters.add(Criteria.where("customerName").regex(rx, "i"));
    }

    if (type != null && !type.isBlank()) {
      filters.add(Criteria.where("paymentType").is(type.trim()));
    }

    if (from != null || to != null) {
      Criteria date = Criteria.where("date");
      if (from != null) date = date.gte(from);
      if (to != null)   date = date.lte(to);
      filters.add(date);
    }

    Query q;
    if (filters.isEmpty()) {
      q = new Query();
    } else {
      q = new Query(new Criteria().andOperator(filters.toArray(new Criteria[0])));
    }

    q.with(Sort.by(Sort.Direction.DESC, "date", "createdAt"));
    return mongo.find(q, Payment.class);
  }

  public Payment get(String id) {
    return repo.findById(id).orElse(null);
  }

  public void delete(String id) {
    repo.deleteById(id);
  }

  private String escapeRegex(String s) {
    // escape regex metacharacters to avoid malformed patterns / regex DOS
    return s.replaceAll("([\\\\.^$|?*+()\\[\\]{}])", "\\\\$1");
  }
}
