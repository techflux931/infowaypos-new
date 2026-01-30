package com.pos.repository;

import com.pos.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Customer operations using MongoDB.
 */
public interface CustomerRepository extends MongoRepository<Customer, String> {

    /**
     * Find a customer by their exact code.
     * Used to ensure customer code uniqueness.
     *
     * @param code customer code
     * @return optional matching customer
     */
    Optional<Customer> findByCode(String code);

    /**
     * Search customers by partial match on code or name (case-insensitive).
     *
     * @param code partial or full customer code
     * @param firstName partial or full first name
     * @param lastName partial or full last name
     * @return list of matching customers
     */
    List<Customer> findByCodeContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
        String code, String firstName, String lastName
    );
}
