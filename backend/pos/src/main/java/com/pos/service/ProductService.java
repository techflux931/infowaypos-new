package com.pos.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.pos.model.Product;
import com.pos.repository.ProductRepository;

/**
 * Service layer for managing Product entities.
 * Handles validation, uniqueness checks, and repository interaction.
 */
@Service
public class ProductService {

    private static final String RESPONSE_KEY = "message";
    private static final String MSG_DUP_BARCODE = "❌ Barcode already exists.";
    private static final String MSG_DUP_CODE = "❌ Product code already exists.";
    private static final String MSG_DUP_PCODE = "❌ Pole-scale product code already exists.";

    private final ProductRepository productRepo;

    public ProductService(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    /* =========================
       CREATE / SAVE PRODUCT
       ========================= */
    public ResponseEntity<Object> saveProduct(Product product) {
        try {
            normalize(product);

            if (notBlank(product.getBarcode()) && productRepo.existsByBarcode(product.getBarcode())) {
                return conflict(MSG_DUP_BARCODE);
            }
            if (notBlank(product.getCode()) && productRepo.existsByCode(product.getCode())) {
                return conflict(MSG_DUP_CODE);
            }
            if (notBlank(product.getProductCode()) && productRepo.existsByProductCode(product.getProductCode())) {
                return conflict(MSG_DUP_PCODE);
            }

            Product saved = productRepo.save(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (DuplicateKeyException e) {
            return conflict("❌ Duplicate key found in product fields.");
        } catch (Exception e) {
            return error("❌ Failed to save product: " + safeMsg(e));
        }
    }

    /* =========================
       READ OPERATIONS
       ========================= */
    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    public Optional<Product> getProductByCode(String code) {
        return productRepo.findByCode(code);
    }

    public Optional<Product> getProductByProductCode(String productCode) {
        return productRepo.findByProductCode(productCode);
    }

    /* =========================
       DELETE OPERATION
       ========================= */
    public ResponseEntity<Object> deleteProduct(String id) {
        if (!productRepo.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap(RESPONSE_KEY, "❌ Product not found."));
        }
        productRepo.deleteById(id);
        return ResponseEntity.ok(Collections.singletonMap(RESPONSE_KEY, "✅ Product deleted successfully."));
    }

    /* =========================
       Helpers
       ========================= */
    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static void normalize(Product p) {
        if (p == null) return;
        if (p.getBarcode() != null)     p.setBarcode(p.getBarcode().trim());
        if (p.getCode() != null)        p.setCode(p.getCode().trim());
        if (p.getProductCode() != null) p.setProductCode(p.getProductCode().trim());
        if (p.getName() != null)        p.setName(p.getName().trim());
        if (p.getUnit() != null)        p.setUnit(p.getUnit().trim());
    }

    private static String safeMsg(Exception e) {
        return e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
    }

    private static ResponseEntity<Object> conflict(String message) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Collections.singletonMap(RESPONSE_KEY, message));
    }

    private static ResponseEntity<Object> error(String message) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap(RESPONSE_KEY, message));
    }
}
