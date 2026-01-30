package com.pos.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;

import com.pos.model.Company;

public interface CompanyService {

    List<Company> getAllCompanies();

    Optional<Company> getCompanyByAdmin(String username);

    Optional<Company> getCompanyByClient(String username);

    /**
     * Create or update a company. Supports:
     * - Base64 logo (data URL) stored in Company.logoUrl
     * - Multi-shop branches in Company.shops
     * - IP fields (publicIp, lanIp)
     */
    Company saveCompanyWithLogo(Company payload, MultipartFile logo) throws IOException;

    boolean deleteCompany(String id);
}
