package com.pos.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.PaymentTxn;

public interface PaymentTxnRepository extends MongoRepository<PaymentTxn, String> {}
