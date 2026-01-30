package com.pos.repository;

import com.pos.model.DeliveryChallan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryChallanRepository extends MongoRepository<DeliveryChallan, String> {
    // You can add custom query methods here if needed
}
