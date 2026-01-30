// src/main/java/com/pos/repository/SaleRepository.java
package com.pos.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.Sale;

@Repository
public interface SaleRepository extends MongoRepository<Sale, String>, SaleRepositoryCustom {

  /** Fast checks elsewhere */
  boolean existsByInvoiceNo(String invoiceNo);

  /* ======================= KPI totals ======================= */

  /** All-time sales (sum of netTotal). Handles string/number fields. */
  @Aggregation(pipeline = {
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$netTotal\", 0 ] } } } } }"
  })
  Double sumNetTotalAll();

  /** Sales total within [start, end). */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$netTotal\", 0 ] } } } } }"
  })
  Double sumNetTotalBetween(Date startInclusive, Date endExclusive);

  /** Amount received in [start, end) → for KPI: Today Received (Sales). */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$amountReceived\", 0 ] } } } } }"
  })
  Double sumAmountReceivedBetween(Date startInclusive, Date endExclusive);

  /* ================== Weekly bar (daily sales) ================== */

  /**
   * Sums sales per day for [start, end), formatted in Asia/Dubai.
   * Ensure your documents use the field "date" as a Mongo Date.
   */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$project\": { " +
      "    \"day\": { \"$dateToString\": { \"format\": \"%Y-%m-%d\", \"date\": \"$date\", \"timezone\": \"Asia/Dubai\" } }, " +
      "    \"total\": { \"$toDouble\": { \"$ifNull\": [ \"$netTotal\", 0 ] } } } }",
      "{ \"$group\": { \"_id\": \"$day\", \"total\": { \"$sum\": \"$total\" } } }",
      "{ \"$project\": { \"_id\": 0, \"date\": \"$_id\", \"total\": 1 } }",
      "{ \"$sort\": { \"date\": 1 } }"
  })
  List<DailyTotal> dailyNetTotalBetween(Date startInclusive, Date endExclusive);

  interface DailyTotal {
    String getDate();   // YYYY-MM-DD
    Double getTotal();
  }

  /* ================= Top products (revenue = qty * unitPrice) ================= */

  /**
   * All-time top products by revenue (qty * unitPrice).
   * Uses name, falling back to productCode when name missing.
   */
  @Aggregation(pipeline = {
      "{ \"$unwind\": { \"path\": \"$items\", \"preserveNullAndEmptyArrays\": false } }",
      "{ \"$group\": { " +
      "    \"_id\": { \"$ifNull\": [ \"$items.name\", \"$items.productCode\" ] }, " +
      "    \"value\": { \"$sum\": { \"$multiply\": [ " +
      "        { \"$toDouble\": { \"$ifNull\": [ \"$items.qty\", 0 ] } }, " +
      "        { \"$toDouble\": { \"$ifNull\": [ \"$items.unitPrice\", 0 ] } } ] } } } }",
      "{ \"$project\": { \"_id\": 0, \"name\": \"$_id\", \"value\": 1 } }",
      "{ \"$sort\": { \"value\": -1 } }",
      "{ \"$limit\": ?0 }"
  })
  List<TopProduct> topProducts(int limit);

  /**
   * Top products within [start, end).
   */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$unwind\": { \"path\": \"$items\", \"preserveNullAndEmptyArrays\": false } }",
      "{ \"$group\": { " +
      "    \"_id\": { \"$ifNull\": [ \"$items.name\", \"$items.productCode\" ] }, " +
      "    \"value\": { \"$sum\": { \"$multiply\": [ " +
      "        { \"$toDouble\": { \"$ifNull\": [ \"$items.qty\", 0 ] } }, " +
      "        { \"$toDouble\": { \"$ifNull\": [ \"$items.unitPrice\", 0 ] } } ] } } } }",
      "{ \"$project\": { \"_id\": 0, \"name\": \"$_id\", \"value\": 1 } }",
      "{ \"$sort\": { \"value\": -1 } }",
      "{ \"$limit\": ?2 }"
  })
  List<TopProduct> topProductsBetween(Date startInclusive, Date endExclusive, int limit);

  interface TopProduct {
    String getName();
    Double getValue();
  }
}
