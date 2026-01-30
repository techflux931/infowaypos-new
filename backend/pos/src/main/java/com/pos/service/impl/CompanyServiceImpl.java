package com.pos.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.pos.model.Company;
import com.pos.model.Shop;
import com.pos.repository.CompanyRepository;
import com.pos.service.CompanyService;

@Service
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository repo;

    public CompanyServiceImpl(CompanyRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Company> getAllCompanies() {
        return repo.findAll();
    }

    @Override
    public Optional<Company> getCompanyByAdmin(String username) {
        if (!StringUtils.hasText(username)) return Optional.empty();
        return repo.findByAdminUsername(username);
    }

    @Override
    public Optional<Company> getCompanyByClient(String username) {
        if (!StringUtils.hasText(username)) return Optional.empty();
        return repo.findByClientUsername(username);
    }

    @Override
    public Company saveCompanyWithLogo(Company payload, MultipartFile logo) throws IOException {
        Objects.requireNonNull(payload, "Company payload is required");

        final Company entity;
        if (StringUtils.hasText(payload.getId())) {
            entity = repo.findById(payload.getId()).orElseGet(Company::new);
            entity.setId(payload.getId());
        } else {
            entity = new Company();
        }

        // -------- merge simple fields --------
        entity.setName(t(payload.getName()));
        entity.setTrn(t(payload.getTrn()));
        entity.setAddress(t(payload.getAddress()));
        entity.setPincode(t(payload.getPincode()));
        entity.setPhone(t(payload.getPhone()));
        entity.setMobile(t(payload.getMobile()));
        entity.setEmail(t(payload.getEmail()));
        entity.setAdminUsername(t(payload.getAdminUsername()));
        entity.setClientUsername(t(payload.getClientUsername()));

        // keep legacy single-shop id for single-shop installs
        entity.setShopId(t(payload.getShopId()));

        // -------- merge shops (multi-branch) --------
        if (payload.getShops() != null) {
            entity.setShops(normalizeShops(payload.getShops()));
        } else if (entity.getShops() == null) {
            entity.setShops(new ArrayList<>());
        }

        // -------- logo as Base64 (data URL) --------
        if (logo != null && !logo.isEmpty()) {
            String mime = Optional.ofNullable(logo.getContentType()).orElse("image/png");
            String b64 = Base64.getEncoder().encodeToString(logo.getBytes());
            entity.setLogoUrl("data:" + mime + ";base64," + b64);
        }

        return repo.save(entity);
    }

    @Override
    public boolean deleteCompany(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    /* ========= helpers ========= */

    private static String t(String s) { return s == null ? null : s.trim(); }

    /**
     * Normalize shops:
     *  - generate id if missing
     *  - only ONE default=true
     *  - remove exact duplicate names (case-insensitive), keep the first
     */
    private List<Shop> normalizeShops(List<Shop> in) {
        if (in == null) return new ArrayList<>();

        // dedupe by name (case-insensitive)
        Map<String, Shop> byName = new LinkedHashMap<>();
        for (Shop s : in) {
            if (s == null) continue;
            String key = Optional.ofNullable(s.getName()).orElse("").trim().toLowerCase();
            byName.putIfAbsent(key, s);
        }
        List<Shop> list = new ArrayList<>(byName.values());

        // ensure ids
        for (Shop s : list) {
            if (!StringUtils.hasText(s.getId())) {
                s.setId("shop_" + UUID.randomUUID().toString().substring(0, 8));
            }
            if (s.getName() != null) s.setName(s.getName().trim());
        }

        // enforce a single default
        Optional<Shop> firstDefault = list.stream().filter(Shop::isDefaultShop).findFirst();
        if (firstDefault.isPresent()) {
            String keep = firstDefault.get().getId();
            for (Shop s : list) s.setDefaultShop(Objects.equals(s.getId(), keep));
        }

        return list;
    }
}
