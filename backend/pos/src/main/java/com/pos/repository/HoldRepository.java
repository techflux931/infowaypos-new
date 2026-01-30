package com.pos.repository;

import com.pos.model.Hold;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HoldRepository extends MongoRepository<Hold, String>, HoldRepositoryCustom { }
