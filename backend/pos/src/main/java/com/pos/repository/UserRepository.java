package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsernameAndPassword(String username, String password);
    User findByUsername(String username);
}
