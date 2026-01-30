package com.pos.service;

import com.pos.model.DeveloperSettings;
import com.pos.repository.DeveloperSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DeveloperSettingsService {

    private final DeveloperSettingsRepository repo;

    public DeveloperSettingsService(DeveloperSettingsRepository repo) {
        this.repo = repo;
    }

    /**
     * Get the single Developer Settings document from MongoDB.
     * If not found, create a default one so frontend always has data.
     */
    public DeveloperSettings getSettings() {
        Optional<DeveloperSettings> existingOpt = repo.findAll().stream().findFirst();
        if (existingOpt.isPresent()) {
            return existingOpt.get();
        }

        // No record found — create default record
        DeveloperSettings defaults = new DeveloperSettings();
        defaults.setShopName("SuperMart UAE");
        defaults.setLocation("Dubai Main Branch");
        defaults.setVersion("v1.0.5");
        defaults.setAmcExpiry("2026-01-01");
        defaults.setShopsCount(1);
        defaults.setUsersCount(1);
        defaults.setPhone("+971 50 000 0000");
        defaults.setTrn("100000000000000");
        defaults.setEmail("info@supermart.ae");
        defaults.setLastLoginAdmin("");
        defaults.setLastLoginCashier("");
        defaults.setLastLoginDeveloper("");
        defaults.setIpAddress("");
        defaults.setDeviceInfo("");
        defaults.setScaleEmbedPrice(false);
        defaults.setAutoShowOnPole(false);

        return repo.save(defaults);
    }

    /**
     * Update Developer Settings in MongoDB.
     * If a record exists, preserve its ID and update fields.
     * If not, save as a new record.
     */
    public DeveloperSettings updateSettings(DeveloperSettings updated) {
        Optional<DeveloperSettings> existingOpt = repo.findAll().stream().findFirst();

        if (existingOpt.isPresent()) {
            DeveloperSettings existing = existingOpt.get();
            updated.setId(existing.getId()); // keep same _id
        }

        return repo.save(updated);
    }
}
