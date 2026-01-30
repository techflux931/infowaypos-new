// src/main/java/com/pos/repository/TallySettingRepository.java
package com.pos.repository;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.TallySetting;

public interface TallySettingRepository extends MongoRepository<TallySetting, String> {}
