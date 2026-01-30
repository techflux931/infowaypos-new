package com.pos.repository;

import com.pos.model.PosSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PosSettingsRepository extends MongoRepository<PosSettings, String> {}
