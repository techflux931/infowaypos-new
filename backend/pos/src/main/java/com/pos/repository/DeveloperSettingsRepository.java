package com.pos.repository;

import com.pos.model.DeveloperSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DeveloperSettingsRepository extends MongoRepository<DeveloperSettings, String> {
}
