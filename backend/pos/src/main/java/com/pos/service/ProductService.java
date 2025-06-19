package com.pos.service;

import com.pos.model.Product;
import com.pos.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository repository;

    // ✅ Constructor without @Autowired — clean Spring Boot 3+ style
    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public Product addProduct(Product product) {
        return repository.save(product);
    }

    public Optional<Product> getProductByBarcode(String barcode) {
        return repository.findByBarcode(barcode);
    }

    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    public Optional<Product> updateProduct(String id, Product updatedProduct) {
        return repository.findById(id).map(existing -> {
            updatedProduct.setId(id);
            return repository.save(updatedProduct);
        });
    }

    public void deleteProduct(String id) {
        repository.deleteById(id);
    }
}
