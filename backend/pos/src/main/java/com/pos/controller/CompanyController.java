package com.pos.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.model.Company;
import com.pos.model.Shop;
import com.pos.service.CompanyService;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class CompanyController {

    private final CompanyService companyService;
    private final ObjectMapper objectMapper;

    public CompanyController(CompanyService companyService, ObjectMapper objectMapper) {
        this.companyService = companyService;
        this.objectMapper = objectMapper;
    }

    // ============================
    // 1) Developer: list all
    // ============================
    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getAllCompanies(@RequestParam(required = false) String role) {
        if ("Developer".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(companyService.getAllCompanies());
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    // ============================
    // 2) Admin → company by admin username
    // ============================
    @GetMapping("/companies/admin/{username}")
    public ResponseEntity<Company> getCompanyByAdmin(@PathVariable String username) {
        return companyService.getCompanyByAdmin(username)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // ============================
    // 3) Client → company by client username
    // ============================
    @GetMapping("/companies/my/{username}")
    public ResponseEntity<Company> getCompanyByClient(@PathVariable String username) {
        return companyService.getCompanyByClient(username)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // ============================
    // 4) Get first company (generic)
    // ============================
    @GetMapping("/company")
    public ResponseEntity<Company> getCompany() {
        Optional<Company> c = companyService.getAllCompanies().stream().findFirst();
        return c.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // ============================
    // 5) Create/Update company (multipart)
    //     - accepts "shops" as JSON string (optional)
    // ============================
    @PostMapping(value = "/company", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> saveOrUpdateCompany(
            @RequestParam(required = false) String id,
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String trn,
            @RequestParam(required = false, defaultValue = "") String address,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String mobile,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String shopId,           // kept for backward compatibility
            @RequestParam(required = false) String adminUsername,
            @RequestParam(required = false) String clientUsername,
            @RequestParam(required = false) String shops,            // JSON string → List<Shop>
            @RequestParam(required = false) MultipartFile logo
    ) {
        try {
            if (!StringUtils.hasText(name)) {
                return ResponseEntity.badRequest().body("Company name is required");
            }

            List<Shop> shopList = Collections.emptyList();
            if (StringUtils.hasText(shops)) {
                // parse JSON array sent from React (CompanyForm)
                shopList = objectMapper.readValue(shops, new TypeReference<List<Shop>>() {});
            }

            Company payload = new Company();
            payload.setId(id);
            payload.setName(name.trim());
            payload.setTrn(trn);
            payload.setAddress(address);
            payload.setPincode(pincode);
            payload.setPhone(phone);
            payload.setMobile(mobile);
            payload.setEmail(email);
            payload.setShopId(shopId);              // for single-shop installs
            payload.setAdminUsername(adminUsername);
            payload.setClientUsername(clientUsername);
            payload.setShops(shopList);             // multi-shop branches

            Company saved = companyService.saveCompanyWithLogo(payload, logo);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Logo processing failed: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Save failed: " + e.getMessage());
        }
    }

    // ============================
    // 6) Delete by id
    // ============================
    @DeleteMapping("/company/{id}")
    public ResponseEntity<String> deleteCompany(@PathVariable String id) {
        boolean deleted = companyService.deleteCompany(id);
        if (deleted) return ResponseEntity.ok("✅ Company deleted successfully");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("❌ Company not found");
    }
}
