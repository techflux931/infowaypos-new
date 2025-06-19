package com.pos.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.dto.ProductDTO;
import com.pos.model.Product;
import com.pos.service.ProductService;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService service;

    // ✅ Constructor injection (cleaner than @Autowired)
    public ProductController(ProductService service) {
        this.service = service;
    }

    @PostMapping
    public ProductDTO addProduct(@RequestBody ProductDTO dto) {
        Product product = dto.toEntity();
        return ProductDTO.fromEntity(service.addProduct(product));
    }

    @GetMapping("/{barcode}")
    public Optional<ProductDTO> getByBarcode(@PathVariable String barcode) {
        return service.getProductByBarcode(barcode).map(ProductDTO::fromEntity);
    }

    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return service.getAllProducts()
                      .stream()
                      .map(ProductDTO::fromEntity)
                      .toList(); // ✅ Java 16+
    }

    @PutMapping("/{id}")
    public Optional<ProductDTO> updateProduct(@PathVariable String id, @RequestBody ProductDTO dto) {
        return service.updateProduct(id, dto.toEntity())
                      .map(ProductDTO::fromEntity);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id) {
        service.deleteProduct(id);
    }
}
