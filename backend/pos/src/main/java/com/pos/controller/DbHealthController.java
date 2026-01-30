package com.pos.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.repository.ExpenseRepository;
import com.pos.repository.PurchaseRepository;
import com.pos.repository.SaleRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class DbHealthController {

  private final MongoTemplate mongoTemplate;
  private final SaleRepository saleRepo;
  private final PurchaseRepository purchaseRepo;
  private final ExpenseRepository expenseRepo;

  @GetMapping("/db")
  public Map<String, Object> db() {
    Map<String, Object> r = new LinkedHashMap<>();
    Document ping = mongoTemplate.executeCommand("{ ping: 1 }");
    r.put("ok", ping.get("ok"));                 // Mongo ping ഫലം (1.0 means OK)
    r.put("sales", saleRepo.count());            // sales കളക്ഷൻ Count
    r.put("purchases", purchaseRepo.count());    // purchases കളക്ഷൻ Count
    r.put("expenses", expenseRepo.count());      // expenses കളക്ഷൻ Count
    return r;
  }
}
