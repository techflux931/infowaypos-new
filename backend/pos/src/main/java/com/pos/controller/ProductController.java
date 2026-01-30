// src/main/java/com/pos/controller/ProductController.java
package com.pos.controller;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Product;
import com.pos.repository.ProductRepository;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    /* ---- messages ---- */
    private static final String MSG_DUP_BARCODE    = "❌ Barcode already exists.";
    private static final String MSG_DUP_CODE       = "❌ Product code already exists.";
    private static final String MSG_DUP_PCODE      = "❌ Pole scale product code already exists.";
    private static final String MSG_BAD_QTY        = "❌ Subitem quantity exceeds main stock.";
    private static final String MSG_BAD_SUB_FIELDS = "❌ Subitem price/factor must be ≥ 0.";

    private final ProductRepository repo;

    public ProductController(ProductRepository repo) {
        this.repo = repo;
    }

    /* ==========================================================
       CREATE
       ========================================================== */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> create(@RequestBody Product product) {
        try {
            normalize(product);

            if (notBlank(product.getBarcode()) && repo.existsByBarcode(product.getBarcode()))
                return conflict(MSG_DUP_BARCODE);

            if (notBlank(product.getCode()) && repo.existsByCode(product.getCode()))
                return conflict(MSG_DUP_CODE);

            if (notBlank(product.getProductCode()) && repo.existsByProductCode(product.getProductCode()))
                return conflict(MSG_DUP_PCODE);

            if (hasInvalidSubitemQuantity(product))
                return bad(MSG_BAD_QTY);

            if (hasInvalidSubitemFields(product))
                return bad(MSG_BAD_SUB_FIELDS);

            Product saved = repo.save(product);
            if (log.isInfoEnabled()) log.info("✅ Product created: {} ({})", ns(saved.getName()), saved.getId());

            return ResponseEntity
                    .created(URI.create("/api/products/" + saved.getId()))
                    .body(saved);

        } catch (DuplicateKeyException dke) {
            return conflict(friendlyDuplicateMessage(dke));
        } catch (Exception e) {
            log.error("❌ Error creating product", e);
            return error("❌ Error creating product: " + safeMsg(e));
        }
    }

    /* ==========================================================
       READ ALL
       ========================================================== */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Product>> findAll() {
        try {
            return ResponseEntity.ok(repo.findAll());
        } catch (Exception e) {
            log.error("❌ Failed to load products", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /* ==========================================================
       READ BY ID
       ========================================================== */
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Product> findById(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /* ==========================================================
       READ BY POLE SCALE CODE
       ========================================================== */
    @GetMapping(value = "/by-product-code/{productCode}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Product> findByProductCode(@PathVariable String productCode) {
        return repo.findByProductCode(productCode)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /* ==========================================================
       UPDATE
       ========================================================== */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Product incoming) {
        Optional<Product> existingOpt = repo.findById(id);
        if (existingOpt.isEmpty()) return notFound("❌ Product not found.");

        try {
            normalize(incoming);
            incoming.setId(id);

            if (notBlank(incoming.getBarcode()) && repo.existsByBarcodeAndIdNot(incoming.getBarcode(), id))
                return conflict(MSG_DUP_BARCODE);

            if (notBlank(incoming.getCode()) && repo.existsByCodeAndIdNot(incoming.getCode(), id))
                return conflict(MSG_DUP_CODE);

            if (notBlank(incoming.getProductCode()) && repo.existsByProductCodeAndIdNot(incoming.getProductCode(), id))
                return conflict(MSG_DUP_PCODE);

            if (hasInvalidSubitemQuantity(incoming))
                return bad(MSG_BAD_QTY);

            if (hasInvalidSubitemFields(incoming))
                return bad(MSG_BAD_SUB_FIELDS);

            Product updated = repo.save(incoming);
            if (log.isInfoEnabled()) log.info("✏️ Product updated: {} ({})", ns(updated.getName()), updated.getId());
            return ResponseEntity.ok(updated);

        } catch (DuplicateKeyException dke) {
            return conflict(friendlyDuplicateMessage(dke));
        } catch (Exception e) {
            log.error("❌ Error updating product", e);
            return error("❌ Error updating product: " + safeMsg(e));
        }
    }

    /* ==========================================================
       DELETE
       ========================================================== */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String role) {

        if (role == null || !role.equalsIgnoreCase("admin"))
            return forbidden("❌ Unauthorized: Only Admin can delete products.");

        if (!repo.existsById(id))
            return notFound("❌ Product not found.");

        try {
            repo.deleteById(id);
            if (log.isInfoEnabled()) log.info("🗑️ Product deleted: {}", id);
            return ok("✅ Product deleted successfully.");
        } catch (Exception e) {
            log.error("❌ Error deleting product", e);
            return error("❌ Error deleting product: " + safeMsg(e));
        }
    }

    /* ==========================================================
       UNIQUE CHECK
       ========================================================== */
    @GetMapping(value = "/check-unique", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UniqueCheckResponse> checkUnique(
            @RequestParam(required = false) String barcode,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String productCode) {

        boolean barcodeUnique     = !notBlank(barcode)     || !repo.existsByBarcode(barcode);
        boolean codeUnique        = !notBlank(code)        || !repo.existsByCode(code);
        boolean productCodeUnique = !notBlank(productCode) || !repo.existsByProductCode(productCode);

        return ResponseEntity.ok(new UniqueCheckResponse(barcodeUnique, codeUnique, productCodeUnique));
    }

    /* ==========================================================
       CSV EXPORT
       ========================================================== */
    @GetMapping(value = "/excel/products.csv")
    public ResponseEntity<Resource> exportCsv() {
        try {
            List<Product> list = repo.findAll();
            StringBuilder csv = new StringBuilder("No,Barcode,Code,ProductCode,Name,Stock,Unit\n");
            for (int i = 0; i < list.size(); i++) {
                Product p = list.get(i);
                csv.append(i + 1).append(',')
                   .append(ns(p.getBarcode())).append(',')
                   .append(ns(p.getCode())).append(',')
                   .append(ns(p.getProductCode())).append(',')
                   .append(ns(p.getName())).append(',')
                   .append(p.getStock() == null ? "" : p.getStock().toPlainString()).append(',')
                   .append(ns(p.getUnit())).append('\n');
            }

            byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
            Resource body = new ByteArrayResource(bytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products.csv")
                    .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                    .contentLength(bytes.length)
                    .body(body);
        } catch (Exception e) {
            log.error("❌ Failed to export CSV", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /* ==========================================================
       INTERNALS
       ========================================================== */

    // tiny response DTOs
    private record Message(String message) { static Message of(String m) { return new Message(m); } }
    private record UniqueCheckResponse(boolean barcodeUnique, boolean codeUnique, boolean productCodeUnique) {}

    // uniform “message” responses
    private static ResponseEntity<Message> ok(String m)        { return ResponseEntity.ok(Message.of(m)); }
    private static ResponseEntity<Message> bad(String m)       { return ResponseEntity.badRequest().body(Message.of(m)); }
    private static ResponseEntity<Message> conflict(String m)  { return ResponseEntity.status(HttpStatus.CONFLICT).body(Message.of(m)); }
    private static ResponseEntity<Message> notFound(String m)  { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Message.of(m)); }
    private static ResponseEntity<Message> forbidden(String m) { return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Message.of(m)); }
    private static ResponseEntity<Message> error(String m)     { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Message.of(m)); }

    // utils
    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static String ns(String s)        { return s == null ? "" : s; }

    /** Trim common string fields to avoid space-only duplicates. */
    private static void normalize(Product p) {
        if (p == null) return;
        if (p.getBarcode()     != null) p.setBarcode(p.getBarcode().trim());
        if (p.getCode()        != null) p.setCode(p.getCode().trim());
        if (p.getProductCode() != null) p.setProductCode(p.getProductCode().trim());
        if (p.getName()        != null) p.setName(p.getName().trim());
        if (p.getUnit()        != null) p.setUnit(p.getUnit().trim());
        if (p.getCategory()    != null) p.setCategory(p.getCategory().trim());
        if (p.getBrand()       != null) p.setBrand(p.getBrand().trim());

        if (p.getSubItems() != null) {
            p.getSubItems().forEach(s -> {
                if (s.getUnit()    != null) s.setUnit(s.getUnit().trim());
                if (s.getBarcode() != null) s.setBarcode(s.getBarcode().trim());
            });
        }
    }

    private static boolean hasInvalidSubitemQuantity(Product p) {
        if (p.getSubItems() == null || p.getSubItems().isEmpty()) return false;

        double subTotal = p.getSubItems().stream()
                .map(Product.SubItem::getFactor)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        double mainStock = p.getStock() == null ? 0d : p.getStock().doubleValue();
        return subTotal > mainStock;
    }

    private static boolean hasInvalidSubitemFields(Product p) {
        if (p.getSubItems() == null) return false;
        return p.getSubItems().stream().anyMatch(sub -> {
            BigDecimal retail = sub.getRetail();
            BigDecimal factor = sub.getFactor();
            boolean badRetail = retail != null && retail.signum() < 0;
            boolean badFactor = factor != null && factor.signum() < 0;
            return badRetail || badFactor;
        });
    }

    private static String friendlyDuplicateMessage(DuplicateKeyException dke) {
        String s = String.valueOf(dke.getMessage()).toLowerCase();
        if (s.contains("subitems.barcode")) return "❌ A subitem barcode already exists.";
        if (s.contains("productcode"))      return MSG_DUP_PCODE;
        if (s.contains("barcode"))          return MSG_DUP_BARCODE;
        if (s.contains("code"))             return MSG_DUP_CODE;
        return "❌ Duplicate key found.";
    }

    private static String safeMsg(Exception e) {
        String m = e.getMessage();
        return (m == null || m.isBlank()) ? e.getClass().getSimpleName() : m;
    }
}

