// src/main/java/com/pos/repository/CompanyRepository.java
package com.pos.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.pos.model.Company;

/** CRUD + a few branch-aware helpers. */
public interface CompanyRepository extends MongoRepository<Company, String> {

    /* ---- Legacy single-shop helpers (still useful for 1-shop installs) ---- */
    Optional<Company> findByShopId(String shopId);
    boolean existsByShopId(String shopId);

    /* ---- Owner/admin/client mappings ---- */
    Optional<Company> findByAdminUsername(String adminUsername);
    Optional<Company> findByClientUsername(String clientUsername);

    /* ---- Multi-shop: search by embedded shops[].id ---- */
    @Query("{ 'shops.id': ?0 }")
    Optional<Company> findByShopsId(String shopId);

    @Query(value = "{ 'shops.id': ?0 }", exists = true)
    boolean existsByShopsId(String shopId);

    /* Optional: find companies that contain a shop with this (case-insensitive) name */
    @Query("{ 'shops': { $elemMatch: { 'name': { $regex: ?0, $options: 'i' } } } }")
    List<Company> findByShopsNameLike(String nameRegex);
}
