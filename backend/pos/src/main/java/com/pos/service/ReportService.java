// src/main/java/com/pos/service/ReportService.java
package com.pos.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.count;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.fields;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.limit;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.skip;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.sort;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.unwind;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.aggregation.ComparisonOperators;
import org.springframework.data.mongodb.core.aggregation.ConditionalOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import com.pos.dto.ReportResponse;

/** Report aggregation service (MongoDB). */
@Service
public class ReportService {

  private final MongoTemplate mongo;
  public ReportService(MongoTemplate mongo) { this.mongo = mongo; }

  /* ================= Collections ================= */
  private static final String C_INVOICES  = "invoices";
  private static final String C_PURCHASES = "purchases";
  private static final String C_RETURNS   = "returns";
  private static final String C_PAYMENTS  = "payments";
  private static final String C_EXPENSES  = "expenses";
  private static final String C_LEDGERS   = "ledgers";

  /* ================= Common fields ================= */
  private static final String F_DATE     = "date";
  private static final String F_SHIFT    = "shift";
  private static final String F_CASHIER  = "cashier";
  private static final String F_GROSS    = "grossTotal";
  private static final String F_DISCOUNT = "discount";
  private static final String F_VAT      = "vat";
  private static final String F_NET      = "netTotal";
  private static final String F_PAYTYPE  = "paymentType";
  private static final String F_RETAMT   = "returnAmount";
  private static final String F_ITEMS    = "items";
  private static final String F_CUSTOMER_ID   = "customerId";
  private static final String F_CUSTOMER_NAME = "customerName";

  /* ================= Reused literals ================= */
  private static final String K_BILLS       = "bills";
  private static final String K_AMOUNT      = "amount";
  private static final String K_COUNT       = "count";
  private static final String K_TOTAL       = "total";
  private static final String K_TAXABLE     = "taxable";
  private static final String K_OUTPUT_VAT  = "outputVat";
  private static final String K_INPUT_VAT   = "inputVat";
  private static final String K_ENTITY_TYPE = "entityType";
  private static final String K_CUSTOMER    = "CUSTOMER";
  private static final String K_VENDOR      = "VENDOR";
  private static final String K_ENTITY_ID   = "entityId";
  private static final String K_ENTITY_NAME = "entityName";
  private static final String K_DEBIT       = "debit";
  private static final String K_CREDIT      = "credit";
  private static final String K_BALANCE     = "balance";
  private static final String K_CUSTOMER_TXT= "customer";

  /* ================= Payment types ================= */
  private static final String PT_CASH   = "Cash";
  private static final String PT_CARD   = "Card";
  private static final String PT_CREDIT = "Credit";

  /* ================= TZ & date helpers ================= */
  private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");

  private static Date start(LocalDate d){
    return Date.from(d.atStartOfDay(ZONE).toInstant());
  }
  private static Date end(LocalDate d){
    return Date.from(d.plusDays(1).atStartOfDay(ZONE).minusNanos(1).toInstant());
  }
  private static Criteria dateRange(LocalDate from, LocalDate to) {
    return Criteria.where(F_DATE).gte(start(from)).lte(end(to));
  }

  /* ================= Small utils ================= */
  private static double num(Document d, String k){ return ((Number)d.getOrDefault(k,0)).doubleValue(); }
  private static long   numL(Document d, String k){ return ((Number)d.getOrDefault(k,0)).longValue(); }

  private static Map<String,Object> toObjMap(Map<String,?> m){
    return (m == null) ? Map.of() : new HashMap<>(m);
  }

  private static <T> ReportResponse<T> makeResp(List<T> items, Map<String,?> totals, long count){
    ReportResponse<T> r = new ReportResponse<>();
    r.setItems(items);
    r.setTotals(toObjMap(totals));
    r.setCount(count);
    return r;
  }

  /* ------------ helper: strip discount key(s) from items & totals ----------- */
  private static void stripDiscount(ReportResponse<Document> r) {
    if (r == null) return;
    if (r.getItems() != null) {
      for (Document d : r.getItems()) {
        d.remove("discount");
        d.remove("disc");         // some pipelines may output 'disc'
      }
    }
    if (r.getTotals() != null) {
      r.getTotals().remove("discount");
      r.getTotals().remove("disc");
    }
  }

  /* ================= 1) Sales Summary ================= */
  public ReportResponse<Document> salesSummary(LocalDate from, LocalDate to, String shift,
                                               String cashier, String groupBy, int page, int size) {
    Criteria c = dateRange(from, to);
    if (shift != null && !shift.isBlank())     c = c.and(F_SHIFT).is(shift);
    if (cashier != null && !cashier.isBlank()) c = c.and(F_CASHIER).is(cashier);

    String key = F_DATE;
    if ("SHIFT".equalsIgnoreCase(groupBy))   key = F_SHIFT;
    if ("CASHIER".equalsIgnoreCase(groupBy)) key = F_CASHIER;

    Aggregation agg = newAggregation(
      match(c),
      project(F_DATE, F_SHIFT, F_CASHIER, F_GROSS, F_DISCOUNT, F_VAT, F_NET, F_PAYTYPE, F_RETAMT),
      group(key)
        .first(key).as(key)
        .count().as(K_BILLS)
        .sum(F_GROSS).as(F_GROSS)
        .sum(F_DISCOUNT).as(F_DISCOUNT)
        .sum(F_VAT).as(F_VAT)
        .sum(F_NET).as(F_NET)
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CASH)).thenValueOf(F_NET).otherwise(0)).as("cash")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CARD)).thenValueOf(F_NET).otherwise(0)).as("card")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CREDIT)).thenValueOf(F_NET).otherwise(0)).as("credit")
        .sum(F_RETAMT).as("returns"),
      sort(Sort.Direction.ASC, key),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(agg, C_INVOICES, Document.class).getMappedResults();

    Aggregation totalsAgg = newAggregation(
      match(c),
      group()
        .count().as(K_BILLS)
        .sum(F_GROSS).as(F_GROSS)
        .sum(F_DISCOUNT).as(F_DISCOUNT)
        .sum(F_VAT).as(F_VAT)
        .sum(F_NET).as(F_NET)
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CASH)).thenValueOf(F_NET).otherwise(0)).as("cash")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CARD)).thenValueOf(F_NET).otherwise(0)).as("card")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CREDIT)).thenValueOf(F_NET).otherwise(0)).as("credit")
        .sum(F_RETAMT).as("returns")
    );
    Document t = mongo.aggregate(totalsAgg, C_INVOICES, Document.class).getUniqueMappedResult();

    Aggregation countAgg = newAggregation(match(c), group(key), count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_INVOICES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? 0 : numL(cd, "n");

    return makeResp(items, t, count);
  }

  /* ---- overload with excludeDiscount (used by controller) ---- */
  public ReportResponse<Document> salesSummary(
      LocalDate from, LocalDate to, String shift, String cashier, String groupBy, int page, int size, boolean excludeDiscount
  ) {
    ReportResponse<Document> out = this.salesSummary(from, to, shift, cashier, groupBy, page, size);
    if (excludeDiscount) stripDiscount(out);
    return out;
  }

  /* ================= 2) Product Sales ================= */
  public ReportResponse<Document> productSales(LocalDate from, LocalDate to, int page, int size) {
    Criteria c = dateRange(from, to);

    Aggregation a = newAggregation(
      match(c),
      unwind(F_ITEMS),
      group(fields()
        .and("productCode", "$items.productCode")
        .and("productName", "$items.productName")
        .and("unit",        "$items.unit"))
        .sum("$items.qty").as("qty")
        .sum("$items.amount").as(K_AMOUNT)
        .sum("$items.vat").as(F_VAT),
      sort(Sort.by(Sort.Direction.DESC, K_AMOUNT)),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(a, C_INVOICES, Document.class).getMappedResults();

    Aggregation totalsAgg = newAggregation(
      match(c), unwind(F_ITEMS),
      group().sum("$items.qty").as("qty").sum("$items.amount").as(K_AMOUNT).sum("$items.vat").as(F_VAT)
    );
    Document t = mongo.aggregate(totalsAgg, C_INVOICES, Document.class).getUniqueMappedResult();

    Aggregation countAgg = newAggregation(match(c), unwind(F_ITEMS),
      group(fields().and("productCode", "$items.productCode")).count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_INVOICES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, t, count);
  }

  /* ---- overload that matches controller signature (filters + exclude) ---- */
  public ReportResponse<Document> productSales(
      LocalDate from,
      LocalDate to,
      String shift,          // currently unused by agg
      String cashier,        // currently unused
      String category,       // currently unused
      String search,         // currently unused
      String groupBy,        // currently unused (existing agg groups by product)
      String sortBy,         // currently unused
      String sortDir,        // currently unused
      int page,
      int size,
      boolean excludeDiscount
  ) {
    ReportResponse<Document> out = this.productSales(from, to, page, size);
    if (excludeDiscount) stripDiscount(out); // safe even if discount is absent
    return out;
  }

  /* ================= 3) Day / Z ================= */
  public ReportResponse<Document> dayZ(LocalDate from, LocalDate to) {
    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(
      match(c),
      group(F_DATE, F_SHIFT)
        .first(F_DATE).as(F_DATE)
        .first(F_SHIFT).as(F_SHIFT)
        .count().as(K_BILLS)
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CASH)).thenValueOf(F_NET).otherwise(0)).as("cash")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CARD)).thenValueOf(F_NET).otherwise(0)).as("card")
        .sum(ConditionalOperators.when(ComparisonOperators.valueOf(F_PAYTYPE).equalToValue(PT_CREDIT)).thenValueOf(F_NET).otherwise(0)).as("credit")
        .sum(F_VAT).as(F_VAT)
        .sum(F_NET).as("net"),
      sort(Sort.Direction.ASC, F_DATE, F_SHIFT)
    );
    List<Document> items = mongo.aggregate(a, C_INVOICES, Document.class).getMappedResults();

    long bills = 0;
    double cash = 0, card = 0, credit = 0, vat = 0, net = 0;
    for (Document d : items) {
      bills  += numL(d, K_BILLS);
      cash   += num(d, "cash");
      card   += num(d, "card");
      credit += num(d, "credit");
      vat    += num(d, F_VAT);
      net    += num(d, "net");
    }
    return makeResp(items, Map.of(K_BILLS, bills, "cash", cash, "card", card, "credit", credit, F_VAT, vat, "net", net), items.size());
  }

  /* ---- overload that matches controller signature (filters + exclude) ---- */
  public ReportResponse<Document> dayZ(
      LocalDate from,
      LocalDate to,
      String shift,      // not used by current pipeline
      String type,       // DAY | X | Z – not used by current pipeline
      String sortBy,     // not used
      String sortDir,    // not used
      int page,          // not used
      int size,          // not used
      boolean excludeDiscount
  ) {
    ReportResponse<Document> out = this.dayZ(from, to);
    if (excludeDiscount) stripDiscount(out);
    return out;
  }

  /* ================= 4) Shift Summary ================= */
  public ReportResponse<Document> shift(LocalDate from, LocalDate to) {
    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(
      match(c),
      group(F_SHIFT)
        .first(F_SHIFT).as(F_SHIFT)
        .count().as(K_BILLS)
        .sum(F_GROSS).as("gross")
        .sum(F_DISCOUNT).as(F_DISCOUNT)
        .sum(F_VAT).as(F_VAT)
        .sum(F_NET).as("net"),
      sort(Sort.Direction.ASC, F_SHIFT)
    );
    List<Document> items = mongo.aggregate(a, C_INVOICES, Document.class).getMappedResults();
    return makeResp(items, Map.of(), items.size());
  }

  /* ================= 5) Purchases ================= */
  public ReportResponse<Document> purchase(LocalDate from, LocalDate to, int page, int size){
    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(
      match(c),
      group(F_DATE).first(F_DATE).as(F_DATE).count().as(K_BILLS).sum(F_VAT).as(F_VAT).sum(F_NET).as("net"),
      sort(Sort.Direction.ASC, F_DATE),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(a, C_PURCHASES, Document.class).getMappedResults();

    long bills = 0; double vat = 0, net = 0;
    for (Document d : items) {
      bills += numL(d, K_BILLS);
      vat   += num(d, F_VAT);
      net   += num(d, "net");
    }

    Aggregation countAgg = newAggregation(match(c), group(F_DATE), count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_PURCHASES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, Map.of(K_BILLS, bills, F_VAT, vat, "net", net), count);
  }
  public ReportResponse<Document> purchase(LocalDate from, LocalDate to){
    return purchase(from, to, 0, Integer.MAX_VALUE);
  }

  /* ================= 6) Returns / Cancellation ================= */
  public ReportResponse<Document> returns(LocalDate from, LocalDate to, String cashier, String reason, int page, int size){
    Criteria c = dateRange(from, to);
    if (cashier != null && !cashier.isBlank()) c = c.and(F_CASHIER).is(cashier);
    if (reason  != null && !reason.isBlank())  c = c.and("reason").regex(reason, "i");

    Aggregation a = newAggregation(
      match(c),
      group(F_DATE)
        .first(F_DATE).as(F_DATE)
        .sum(K_AMOUNT).as(K_AMOUNT)
        .count().as(K_COUNT),
      sort(Sort.Direction.ASC, F_DATE),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(a, C_RETURNS, Document.class).getMappedResults();

    Aggregation totalsAgg = newAggregation(match(c), group().sum(K_AMOUNT).as(K_AMOUNT).count().as(K_COUNT));
    Document t = mongo.aggregate(totalsAgg, C_RETURNS, Document.class).getUniqueMappedResult();

    Aggregation countAgg = newAggregation(match(c), group(F_DATE), count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_RETURNS, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, t, count);
  }
  public ReportResponse<Document> returns(LocalDate from, LocalDate to){
    return returns(from, to, null, null, 0, Integer.MAX_VALUE);
  }

  /* ================= 7) Payments / Collections ================= */
  public ReportResponse<Document> payments(LocalDate from, LocalDate to, String method, int page, int size){
    Criteria c = dateRange(from, to).and(K_ENTITY_TYPE).is(K_CUSTOMER);
    if (method != null && !method.isBlank()) c = c.and("method").is(method);

    Aggregation a = newAggregation(match(c), sort(Sort.Direction.DESC, F_DATE), skip((long) page * size), limit(size));
    List<Document> items = mongo.aggregate(a, C_PAYMENTS, Document.class).getMappedResults();

    Document t = mongo.aggregate(newAggregation(match(c), group().sum(K_AMOUNT).as(K_AMOUNT)), C_PAYMENTS, Document.class)
                      .getUniqueMappedResult();

    Aggregation countAgg = newAggregation(match(c), group().count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_PAYMENTS, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, t, count);
  }

  /* ================= 8) VAT ================= */
  public ReportResponse<Document> vat(LocalDate from, LocalDate to, String groupBy, int page, int size){
    if ("SUMMARY".equalsIgnoreCase(groupBy)) {
      Criteria cs = dateRange(from, to);
      Criteria cp = dateRange(from, to);

      Document out = mongo.aggregate(newAggregation(match(cs), group().sum(F_VAT).as(K_OUTPUT_VAT)), C_INVOICES,  Document.class).getUniqueMappedResult();
      Document in  = mongo.aggregate(newAggregation(match(cp), group().sum(F_VAT).as(K_INPUT_VAT)),  C_PURCHASES, Document.class).getUniqueMappedResult();

      double outputVat = (out == null) ? 0 : num(out, K_OUTPUT_VAT);
      double inputVat  = (in  == null) ? 0 : num(in,  K_INPUT_VAT);
      Document row = new Document(Map.of("period", "Custom", K_OUTPUT_VAT, outputVat, K_INPUT_VAT, inputVat, "netVat", outputVat - inputVat));

      return makeResp(List.of(row), Map.of(K_OUTPUT_VAT, outputVat, K_INPUT_VAT, inputVat, "netVat", outputVat - inputVat), 1);
    }

    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(
      match(c),
      group(F_DATE)
        .first(F_DATE).as(F_DATE)
        .sum(F_NET).as(K_TOTAL)
        .sum(F_VAT).as(F_VAT),
      project(F_DATE, F_VAT, K_TOTAL)
        .and(ArithmeticOperators.Subtract.valueOf(K_TOTAL).subtract("$" + F_VAT)).as(K_TAXABLE),
      sort(Sort.Direction.ASC, F_DATE),
      skip((long) page * size),
      limit(size)
    );

    List<Document> items = mongo.aggregate(a, C_INVOICES, Document.class).getMappedResults();

    double taxable = 0, vat = 0, total = 0;
    for (Document d : items) {
      taxable += num(d, K_TAXABLE);
      vat     += num(d, F_VAT);
      total   += num(d, K_TOTAL);
    }

    Aggregation countAgg = newAggregation(match(c), group(F_DATE), count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_INVOICES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, Map.of(K_TAXABLE, taxable, F_VAT, vat, K_TOTAL, total), count);
  }
  public ReportResponse<Document> vat(LocalDate from, LocalDate to){
    return vat(from, to, "SUMMARY", 0, 1);
  }

  /* ================= 9) Expenses ================= */
  public ReportResponse<Document> expenses(LocalDate from, LocalDate to, int page, int size){
    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(match(c), sort(Sort.Direction.DESC, F_DATE), skip((long) page * size), limit(size));
    List<Document> items = mongo.aggregate(a, C_EXPENSES, Document.class).getMappedResults();

    Document t = mongo.aggregate(newAggregation(match(c), group().sum(K_AMOUNT).as(K_AMOUNT)), C_EXPENSES, Document.class)
                      .getUniqueMappedResult();

    Aggregation countAgg = newAggregation(match(c), group().count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_EXPENSES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, t, count);
  }

  /* ================= 10) Supplier Outstanding (AP) ================= */
  public ReportResponse<Document> supplierOutstanding(LocalDate asOf, int page, int size){
    Date asOfDate = start(asOf);

    Aggregation a = newAggregation(
      match(Criteria.where(K_ENTITY_TYPE).is(K_VENDOR).and(F_DATE).lte(asOfDate)),
      group(K_ENTITY_ID, K_ENTITY_NAME)
        .first(K_ENTITY_NAME).as("vendor")
        .sum(K_DEBIT).as(K_DEBIT)
        .sum(K_CREDIT).as(K_CREDIT),
      project("vendor").and(ArithmeticOperators.Subtract.valueOf(K_CREDIT).subtract(K_DEBIT)).as(K_TOTAL),
      sort(Sort.Direction.DESC, K_TOTAL),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(a, C_LEDGERS, Document.class).getMappedResults();

    double total = items.stream().mapToDouble(d -> num(d, K_TOTAL)).sum();

    Aggregation countAgg = newAggregation(
      match(Criteria.where(K_ENTITY_TYPE).is(K_VENDOR).and(F_DATE).lte(asOfDate)),
      group(K_ENTITY_ID), count().as("n")
    );
    Document cd = mongo.aggregate(countAgg, C_LEDGERS, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, Map.of(K_TOTAL, total), count);
  }
  public ReportResponse<Document> supplierOutstanding(LocalDate asOf){
    return supplierOutstanding(asOf, 0, Integer.MAX_VALUE);
  }

  /* ================= 11) Customer Summary ================= */
  public ReportResponse<Document> customer(LocalDate from, LocalDate to, int page, int size){
    Criteria c = dateRange(from, to);
    Aggregation a = newAggregation(
      match(c),
      group(F_CUSTOMER_ID, F_CUSTOMER_NAME)
        .first(F_CUSTOMER_NAME).as(K_CUSTOMER_TXT)
        .count().as(K_BILLS)
        .sum(F_VAT).as(F_VAT)
        .sum(F_NET).as("net"),
      sort(Sort.Direction.DESC, "net"),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(a, C_INVOICES, Document.class).getMappedResults();

    long bills = 0; double net = 0, vat = 0;
    for (Document d: items){
      bills += numL(d, K_BILLS);
      net   += num(d, "net");
      vat   += num(d, F_VAT);
    }

    Aggregation countAgg = newAggregation(match(c), group(F_CUSTOMER_ID), count().as("n"));
    Document cd = mongo.aggregate(countAgg, C_INVOICES, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, Map.of(K_BILLS, bills, "net", net, F_VAT, vat), count);
  }
  public ReportResponse<Document> customer(LocalDate from, LocalDate to){
    return customer(from, to, 0, Integer.MAX_VALUE);
  }

  /* ================= 12) Aging (AR) ================= */
  public ReportResponse<Document> aging(LocalDate asOf, boolean onlyOverdue, int page, int size){
    Date asOfDate = start(asOf);

    Aggregation agg = newAggregation(
      match(Criteria.where(K_ENTITY_TYPE).is(K_CUSTOMER).and(F_DATE).lte(asOfDate)),
      group(K_ENTITY_ID, K_ENTITY_NAME)
        .first(K_ENTITY_NAME).as(K_CUSTOMER_TXT)
        .sum(K_DEBIT).as(K_DEBIT)
        .sum(K_CREDIT).as(K_CREDIT),
      project(K_CUSTOMER_TXT).and(ArithmeticOperators.Subtract.valueOf(K_DEBIT).subtract(K_CREDIT)).as(K_BALANCE),
      (onlyOverdue ? match(Criteria.where(K_BALANCE).gt(0)) : match(new Criteria())),
      sort(Sort.Direction.DESC, K_BALANCE),
      skip((long) page * size),
      limit(size)
    );
    List<Document> items = mongo.aggregate(agg, C_LEDGERS, Document.class).getMappedResults();

    double total = items.stream().mapToDouble(d -> num(d, K_BALANCE)).sum();

    Aggregation countAgg = newAggregation(
      match(Criteria.where(K_ENTITY_TYPE).is(K_CUSTOMER).and(F_DATE).lte(asOfDate)),
      group(K_ENTITY_ID, K_ENTITY_NAME).sum(K_DEBIT).as(K_DEBIT).sum(K_CREDIT).as(K_CREDIT),
      project().and(ArithmeticOperators.Subtract.valueOf(K_DEBIT).subtract(K_CREDIT)).as(K_BALANCE),
      (onlyOverdue ? match(Criteria.where(K_BALANCE).gt(0)) : match(new Criteria())),
      group().count().as("n")
    );
    Document cd = mongo.aggregate(countAgg, C_LEDGERS, Document.class).getUniqueMappedResult();
    long count = (cd == null) ? items.size() : numL(cd, "n");

    return makeResp(items, Map.of(K_TOTAL, total), count);
  }
  public ReportResponse<Document> aging(LocalDate asOf){
    return aging(asOf, false, 0, Integer.MAX_VALUE);
  }
}
