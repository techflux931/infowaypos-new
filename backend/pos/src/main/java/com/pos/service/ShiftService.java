package com.pos.service;

import com.pos.dto.CashTotalsDto;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Service
public class ShiftService {

  private final MongoTemplate mongo;

  public ShiftService(MongoTemplate mongo) {      // explicit ctor, no Lombok
    this.mongo = mongo;
  }

  private static final String C_SHIFT_EVENTS = "shift_events";
  private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");

  private Date startOfDay(LocalDate d) {
    return Date.from(d.atStartOfDay(ZONE).toInstant());
  }

  private Date endOfDay(LocalDate d) {
    return Date.from(d.plusDays(1).atStartOfDay(ZONE).minusNanos(1).toInstant());
  }

  /** Write simple “event” documents (X, Z, CASH_IN, CASH_OUT) */
  private void insertEvent(String type, BigDecimal amount, String note, String shift, String cashier) {
    Document doc = new Document("type", type)
        .append("ts", new Date());
    if (amount != null) doc.append("amount", amount);
    if (note   != null) doc.append("note", note.trim());
    if (shift  != null) doc.append("shift", shift);
    if (cashier!= null) doc.append("cashier", cashier);
    mongo.getCollection(C_SHIFT_EVENTS).insertOne(doc);
  }

  public void logX() { insertEvent("X", null, null, null, null); }

  public void logZ() { insertEvent("Z", null, null, null, null); }

  public void cashIn(BigDecimal amount, String note) {
    if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("Amount must be > 0");
    insertEvent("CASH_IN", amount, note, null, null);
  }

  public void cashOut(BigDecimal amount, String note) {
    if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("Amount must be > 0");
    insertEvent("CASH_OUT", amount, note, null, null);
  }

  /** Totals by date range */
  public CashTotalsDto cashTotals(LocalDate from, LocalDate to) {
    Criteria c = Criteria.where("ts").gte(startOfDay(from)).lte(endOfDay(to));
    Aggregation a = newAggregation(
        match(c),
        group("type").sum("amount").as("amt")
    );
    List<Document> r = mongo.aggregate(a, C_SHIFT_EVENTS, Document.class).getMappedResults();

    BigDecimal in = r.stream()
        .filter(d -> "CASH_IN".equals(d.getString("_id")))
        .map(d -> toBig(d.get("amt")))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal out = r.stream()
        .filter(d -> "CASH_OUT".equals(d.getString("_id")))
        .map(d -> toBig(d.get("amt")))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new CashTotalsDto(in, out, in.subtract(out));
  }

  private static BigDecimal toBig(Object v) {
    if (v == null) return BigDecimal.ZERO;
    if (v instanceof BigDecimal) return (BigDecimal) v;
    if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
    return new BigDecimal(v.toString());
  }
}
