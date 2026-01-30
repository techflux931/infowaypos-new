// src/main/java/com/pos/repository/PurchaseReturnRepository.java
package com.pos.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.PurchaseReturn;

@Repository
public interface PurchaseReturnRepository extends MongoRepository<PurchaseReturn, String> {

  /** All-time Purchase Returns sum (grandTotal). */
  @Aggregation(pipeline = {
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$grandTotal\", 0 ] } } } } }"
  })
  Double sumGrandTotalAll();

  /** Purchase Returns sum in [start, end). */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$group\": { \"_id\": null, " +
      "  \"total\": { \"$sum\": { \"$toDouble\": { \"$ifNull\": [ \"$grandTotal\", 0 ] } } } } }"
  })
  Double sumGrandTotalBetween(Date startInclusive, Date endExclusive);

  /** Optional: daily buckets. */
  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$project\": { " +
      "    \"day\": { \"$dateToString\": { \"format\": \"%Y-%m-%d\", \"date\": \"$date\", \"timezone\": \"Asia/Dubai\" } }, " +
      "    \"total\": { \"$toDouble\": { \"$ifNull\": [ \"$grandTotal\", 0 ] } } } }",
      "{ \"$group\": { \"_id\": \"$day\", \"total\": { \"$sum\": \"$total\" } } }",
      "{ \"$project\": { \"_id\": 0, \"date\": \"$_id\", \"total\": 1 } }",
      "{ \"$sort\": { \"date\": 1 } }"
  })
  List<DailyTotal> dailyGrandTotalBetween(Date startInclusive, Date endExclusive);

  interface DailyTotal {
    String getDate();
    Double getTotal();
  }
}
