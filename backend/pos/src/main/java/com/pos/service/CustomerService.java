package com.pos.service;

import java.util.List;
import java.util.Optional;

import com.pos.model.Customer;

/**
 * Service interface for handling Customer operations.
 */
public interface CustomerService {

    /**
     * Save a new customer or update an existing one.
     *
     * @param customer the customer object to save
     * @return the saved customer
     */
    Customer saveCustomer(Customer customer);

    /**
     * Retrieve all customers.
     *
     * @return list of customers
     */
    List<Customer> getAllCustomers();

    /**
     * Search customers by keyword (code, first name, or last name).
     *
     * @param keyword the search keyword
     * @return list of matching customers
     */
    List<Customer> searchCustomers(String keyword);

    /**
     * Find a customer by their unique ID.
     *
     * @param id the MongoDB document ID
     * @return optional customer
     */
    Optional<Customer> findById(String id);

    /**
     * Find a customer by their unique code.
     *
     * @param code customer code
     * @return optional customer
     */
    Optional<Customer> findByCode(String code);

    /**
     * Delete a customer by ID.
     *
     * @param id the MongoDB document ID
     */
    void deleteCustomer(String id);
}
