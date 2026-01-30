package com.pos.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.Product;

public interface ProductRepository extends MongoRepository<Product, String> {

    // Uniqueness checks
    boolean existsByBarcode(String barcode);
    boolean existsByCode(String code);
    boolean existsByProductCode(String productCode);

    // Lookups
    Optional<Product> findByCode(String code);
    Optional<Product> findByProductCode(String productCode);

    // Update-time uniqueness (exclude current id)
    boolean existsByBarcodeAndIdNot(String barcode, String id);
    boolean existsByCodeAndIdNot(String code, String id);
    boolean existsByProductCodeAndIdNot(String productCode, String id);
}
