package com.pos.service.impl;

import com.pos.model.Customer;
import com.pos.repository.CustomerRepository;
import com.pos.service.CustomerService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of CustomerService interface for managing customer records.
 */
@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository repository;

    public CustomerServiceImpl(CustomerRepository repository) {
        this.repository = repository;
    }

    @Override
    public Customer saveCustomer(Customer customer) {
        return repository.save(customer);
    }

    @Override
    public List<Customer> getAllCustomers() {
        return repository.findAll();
    }

    @Override
    public List<Customer> searchCustomers(String keyword) {
        return repository.findByCodeContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                keyword, keyword, keyword
        );
    }

    @Override
    public Optional<Customer> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Customer> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public void deleteCustomer(String id) {
        repository.deleteById(id);
    }
}
