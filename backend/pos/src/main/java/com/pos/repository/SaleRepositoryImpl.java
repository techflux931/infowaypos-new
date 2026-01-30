// src/main/java/com/pos/repository/SaleRepositoryImpl.java
package com.pos.repository;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import com.pos.model.Sale;

@Repository
public class SaleRepositoryImpl implements SaleRepositoryCustom {

  private final MongoTemplate mongo;

  public SaleRepositoryImpl(MongoTemplate mongo) {
    this.mongo = mongo;
  }

  @Override
  public Page<Sale> search(String q, String customer, String paymentType, String saleType,
                           Date from, Date to, Pageable pageable) {

    List<Criteria> and = new ArrayList<>();

    // free-text: invoiceNo, _id, customerName, cashier
    if (q != null && !q.isBlank()) {
      String rx = "(?i).*" + Pattern.quote(q.trim()) + ".*";
      and.add(new Criteria().orOperator(
          where("invoiceNo").regex(rx),
          where("_id").regex(rx),
          where("customerName").regex(rx),
          where("cashier").regex(rx)
      ));
    }

    // customer display name
    if (customer != null && !customer.isBlank()) {
      String rx = "(?i).*" + Pattern.quote(customer.trim()) + ".*";
      and.add(where("customerName").regex(rx));
    }

    // exact paymentType (case-insensitive)
    if (paymentType != null && !paymentType.isBlank()) {
      and.add(where("paymentType").regex("(?i)^" + Pattern.quote(paymentType.trim()) + "$"));
    }

    // exact saleType (case-insensitive)
    if (saleType != null && !saleType.isBlank()) {
      and.add(where("saleType").regex("(?i)^" + Pattern.quote(saleType.trim()) + "$"));
    }

    // date range (inclusive). If only 'to' present, up to end of that day.
    if (from != null || to != null) {
      Criteria c = where("date");
      if (from != null && to != null) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(to);
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        cal.set(Calendar.MILLISECOND, 999);
        c.gte(from).lte(cal.getTime());
      } else if (from != null) {
        c.gte(from);
      } else {
        c.lte(to);
      }
      and.add(c);
    }

    Criteria root = and.isEmpty()
        ? new Criteria()
        : new Criteria().andOperator(and.toArray(Criteria[]::new));

    Sort sort = pageable.getSort().isUnsorted()
        ? Sort.by(Sort.Direction.DESC, "date")
        : pageable.getSort();

    Query query = new Query(root).with(sort);

    long total = mongo.count(query, Sale.class);

    query.skip((long) pageable.getPageNumber() * pageable.getPageSize());
    query.limit(pageable.getPageSize());

    List<Sale> content = mongo.find(query, Sale.class);
    return new PageImpl<>(content, pageable, total);
  }
}
