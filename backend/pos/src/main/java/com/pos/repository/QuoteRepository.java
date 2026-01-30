package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Quote;

public interface QuoteRepository extends MongoRepository<Quote, String> {
    Quote findTopByOrderByQuoteNumberDesc();
}
