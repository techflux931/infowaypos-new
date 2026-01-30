package com.pos.repository;

import com.pos.model.Unit;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UnitRepository extends MongoRepository<Unit, String> {
    boolean existsByName(String name);
}
