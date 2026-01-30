// src/main/java/com/pos/controller/DebugController.java
package com.pos.controller;

import java.util.Map;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {
  private final MongoTemplate mongo;

  @GetMapping("/mongo")
  public Map<String,Object> info() {
    return Map.of(
      "database", mongo.getDb().getName(),
      "collections", mongo.getDb().listCollectionNames().into(new java.util.ArrayList<>()),
      "hold_invoices_count", mongo.getDb().getCollection("hold_invoices").countDocuments()
    );
  }
}
