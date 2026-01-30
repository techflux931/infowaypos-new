package com.pos.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Customer;
import com.pos.service.CustomerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:3000") // React app; adjust if needed
@RequiredArgsConstructor
public class CustomerController {

    private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

    private static final String MSG = "message";
    private static final String CUSTOMER_NOT_FOUND = "Customer not found";
    private static final String DUPLICATE_CODE = "Customer code already exists";

    private final CustomerService customerService;

    // Add customer
    @PostMapping
    public ResponseEntity<?> addCustomer(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("code") ||
                !(payload.containsKey("name") || payload.containsKey("firstName"))) {
                return ResponseEntity.badRequest().body(Map.of(MSG, "Code and Name are required"));
            }

            String code = Objects.toString(payload.get("code"), "").trim();
            if (code.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(MSG, "Code is required"));
            }
            if (customerService.findByCode(code).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(MSG, DUPLICATE_CODE));
            }

            Customer c = new Customer();
            c.setCode(code);

            if (payload.containsKey("firstName")) {
                c.setFirstName(Objects.toString(payload.get("firstName"), ""));
                c.setLastName(Objects.toString(payload.getOrDefault("lastName", ""), ""));
            } else {
                String name = Objects.toString(payload.get("name"), "");
                c.setFirstName(name); // store into firstName for now
            }

            c.setAddress(Objects.toString(payload.getOrDefault("address", ""), ""));
            c.setEmail(Objects.toString(payload.getOrDefault("email", ""), ""));
            c.setCustomerType(Objects.toString(payload.getOrDefault("type", "Cash"), "Cash"));
            c.setMobileNo(Objects.toString(payload.getOrDefault("mobileNo", ""), ""));
            c.setPhoneNo(Objects.toString(payload.getOrDefault("phoneNo", ""), ""));

            log.info("Creating customer with code: {}", code);
            Customer saved = customerService.saveCustomer(c);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            log.error("Error saving customer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(MSG, "Error saving customer: " + e.getMessage()));
        }
    }

    // Get all or search
    @GetMapping
    public ResponseEntity<List<Customer>> getCustomers(@RequestParam(required = false) String search) {
        String q = Optional.ofNullable(search).map(String::trim).orElse("");
        List<Customer> customers = q.isEmpty()
                ? customerService.getAllCustomers()
                : customerService.searchCustomers(q);
        return ResponseEntity.ok(customers);
    }

    // Get by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable String id) {
        return customerService.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(MSG, CUSTOMER_NOT_FOUND)));
    }

    // Update
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable String id, @RequestBody Customer customer) {
        Optional<Customer> existing = customerService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(MSG, CUSTOMER_NOT_FOUND));
        }

        Optional<Customer> duplicate = customerService.findByCode(customer.getCode());
        if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(MSG, DUPLICATE_CODE));
        }

        Customer update = existing.get();
        update.setCode(customer.getCode());
        update.setFirstName(customer.getFirstName());
        update.setLastName(customer.getLastName());
        update.setAddressType(customer.getAddressType());
        update.setAddress(customer.getAddress());
        update.setPlace(customer.getPlace());
        update.setState(customer.getState());
        update.setMobileNo(customer.getMobileNo());
        update.setPhoneNo(customer.getPhoneNo());
        update.setEmail(customer.getEmail());
        update.setCreditPeriod(customer.getCreditPeriod());
        update.setCreditAmount(customer.getCreditAmount());
        update.setJoinDate(customer.getJoinDate());
        update.setCustomerType(customer.getCustomerType());
        update.setDay(customer.getDay());
        update.setDispenser(customer.getDispenser());
        update.setBottle(customer.getBottle());
        update.setTrn(customer.getTrn());
        update.setNationality(customer.getNationality());
        update.setContactPerson(customer.getContactPerson());
        update.setRemark(customer.getRemark());

        log.info("Updating customer with ID: {}", id);
        return ResponseEntity.ok(customerService.saveCustomer(update));
    }

    // Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable String id) {
        if (customerService.findById(id).isPresent()) {
            customerService.deleteCustomer(id);
            log.info("Deleted customer ID: {}", id);
            return ResponseEntity.ok(Map.of(MSG, "Customer deleted"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(MSG, CUSTOMER_NOT_FOUND));
    }
}
