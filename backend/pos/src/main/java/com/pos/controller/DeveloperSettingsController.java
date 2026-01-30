package com.pos.controller;

import com.pos.model.DeveloperSettings;
import com.pos.service.DeveloperSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/developer")
@CrossOrigin(origins = "*")
public class DeveloperSettingsController {

    private final DeveloperSettingsService service;

    public DeveloperSettingsController(DeveloperSettingsService service) {
        this.service = service;
    }

    /**
     * Get the current Developer Settings from MongoDB
     */
    @GetMapping
    public DeveloperSettings getSettings() {
        return service.getSettings();
    }

    /**
     * Update Developer Settings in MongoDB
     */
    @PutMapping
    public DeveloperSettings updateSettings(@RequestBody DeveloperSettings updated) {
        return service.updateSettings(updated);
    }
}
