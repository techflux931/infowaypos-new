// src/main/java/com/pos/repository/PurchaseRepository.java
package com.pos.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.Purchase;

@Repository
public interface PurchaseRepository extends MongoRepository<Purchase, String> {

  /** Sum of all purchases (totals.grandTotal) across the collection. */
  @Aggregation(pipeline = {
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$totals.grandTotal\", 0 ] } } } } }"
  })
  Double sumGrandTotalAll();

  /**
   * Sum purchases in a date range [start, end).
   * Use startOfDay & nextDayStart for “today”.
   */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$totals.grandTotal\", 0 ] } } } } }"
  })
  Double sumGrandTotalBetween(Date startInclusive, Date endExclusive);

  /**
   * Daily totals for a range (for weekly bar chart).
   * Returns ordered YYYY-MM-DD buckets with summed grandTotal.
   */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$project\": { " +
      "    \"day\": { \"$dateToString\": { \"format\": \"%Y-%m-%d\", \"date\": \"$date\", \"timezone\": \"Asia/Dubai\" } }, " +
      "    \"total\": { \"$toDouble\": { \"$ifNull\": [ \"$totals.grandTotal\", 0 ] } } } }",
      "{ \"$group\": { \"_id\": \"$day\", \"total\": { \"$sum\": \"$total\" } } }",
      "{ \"$project\": { \"_id\": 0, \"date\": \"$_id\", \"total\": 1 } }",
      "{ \"$sort\": { \"date\": 1 } }"
  })
  List<DailyTotal> dailyGrandTotalBetween(Date startInclusive, Date endExclusive);

  /** Projection for daily totals (matches aggregation field names). */
  interface DailyTotal {
    String getDate();   // YYYY-MM-DD
    Double getTotal();
  }
}
