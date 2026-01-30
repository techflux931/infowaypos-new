// src/main/java/com/pos/repository/SaleReturnRepository.java
package com.pos.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pos.model.SaleReturn;

@Repository
public interface SaleReturnRepository extends MongoRepository<SaleReturn, String> {

    /** All-time Sales Returns sum (grandTotal). */
    @Aggregation(pipeline = {
        "{ $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } }"
    })
    Double sumGrandTotalAll();

    /** Sales Returns sum in [start, end). */
    @Aggregation(pipeline = {
        "{ $match: { date: { $gte: ?0, $lt: ?1 } } }",
        "{ $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } }"
    })
    Double sumGrandTotalBetween(Date startInclusive, Date endExclusive);

    /** Optional: daily buckets (if you want returns on charts later). */
    @Aggregation(pipeline = {
        "{ $match: { date: { $gte: ?0, $lt: ?1 } } }",
        "{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, " +
            "total: { $sum: { $ifNull: ['$grandTotal', 0] } } } }",
        "{ $project: { _id: 0, date: '$_id', total: 1 } }",
        "{ $sort: { date: 1 } }"
    })
    List<DailyTotal> dailyGrandTotalBetween(Date startInclusive, Date endExclusive);

    interface DailyTotal {
        String getDate();
        Double getTotal();
    }
}
