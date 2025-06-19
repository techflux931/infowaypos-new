package com.pos.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Product;

public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findByBarcode(String barcode);
}
