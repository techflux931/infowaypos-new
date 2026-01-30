// src/main/java/com/pos/repository/TallySyncLogRepository.java
package com.pos.repository;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pos.model.TallySyncLog;

public interface TallySyncLogRepository extends MongoRepository<TallySyncLog, String> {
  List<TallySyncLog> findByDocTypeAndDocIdOrderByCreatedAtDesc(String docType, String docId);
}
