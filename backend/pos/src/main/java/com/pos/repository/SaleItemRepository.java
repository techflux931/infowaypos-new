// src/main/java/com/pos/repository/SaleItemRepository.java
package com.pos.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.repository.Repository;

import com.pos.model.Sale;

/**
 * Aggregations over embedded Sale.items (collection: sales).
 * No @Repository annotation needed; Spring Data picks it up because it extends Repository.
 */
public interface SaleItemRepository extends Repository<Sale, String> {

    /** Top products (all time) by revenue qty*unitPrice. */
    @Aggregation(pipeline = {
        "{ $unwind: { path: '$items', preserveNullAndEmptyArrays: false } }",
        "{ $group: { _id: { $ifNull: ['$items.name', '$items.productCode'] }, " +
            "value: { $sum: { $multiply: [ { $ifNull: ['$items.qty', 0] }, { $ifNull: ['$items.unitPrice', 0] } ] } } } }",
        "{ $project: { _id: 0, name: '$_id', value: 1 } }",
        "{ $sort: { value: -1 } }",
        "{ $limit: ?0 }"
    })
    List<TopProduct> topProducts(int limit);

    /** Top products within [start, end). */
    @Aggregation(pipeline = {
        "{ $match: { date: { $gte: ?0, $lt: ?1 } } }",
        "{ $unwind: { path: '$items', preserveNullAndEmptyArrays: false } }",
        "{ $group: { _id: { $ifNull: ['$items.name', '$items.productCode'] }, " +
            "value: { $sum: { $multiply: [ { $ifNull: ['$items.qty', 0] }, { $ifNull: ['$items.unitPrice', 0] } ] } } } }",
        "{ $project: { _id: 0, name: '$_id', value: 1 } }",
        "{ $sort: { value: -1 } }",
        "{ $limit: ?2 }"
    })
    List<TopProduct> topProductsBetween(Date startInclusive, Date endExclusive, int limit);

    interface TopProduct {
        String getName();
        Double getValue();
    }
}
