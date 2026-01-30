package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Account;

public interface AccountRepo extends MongoRepository<Account, String> {
}
