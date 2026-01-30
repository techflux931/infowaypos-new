// src/main/java/com/pos/repository/ExpenseRepository.java
package com.pos.repository;

import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.Expense;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {

  Page<Expense> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrVendorContainingIgnoreCase(
      String name, String category, String vendor, Pageable pageable
  );

  @Aggregation(pipeline = {
      "{ \"$match\": { \"date\": { \"$gte\": ?0, \"$lt\": ?1 } } }",
      "{ \"$project\": { " +
      "    \"val\": { \"$toDouble\": { \"$ifNull\": [ \"$amount\", { \"$ifNull\": [ \"$totals.amount\", 0 ] } ] } } } }",
      "{ \"$group\": { \"_id\": null, \"total\": { \"$sum\": \"$val\" } } }"
  })
  Double sumAmountBetween(Date startInclusive, Date endExclusive);

  // (Optional) if you also want to show ALL-TIME expenses somewhere:
  @Aggregation(pipeline = {
      "{ \"$project\": { " +
      "    \"val\": { \"$toDouble\": { \"$ifNull\": [ \"$amount\", { \"$ifNull\": [ \"$totals.amount\", 0 ] } ] } } } }",
      "{ \"$group\": { \"_id\": null, \"total\": { \"$sum\": \"$val\" } } }"
  })
  Double sumAmountAll();
}
