package com.pos.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.AccountGroup;

public interface AccountGroupRepository extends MongoRepository<AccountGroup, String> {
  Page<AccountGroup> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
