// src/main/java/com/pos/controller/DashboardController.java
package com.pos.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.dto.dashboard.DashboardMetricsDTO;
import com.pos.dto.dashboard.TopProductDTO;
import com.pos.dto.dashboard.WeeklyPointDTO;
import com.pos.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

  private final DashboardService service;

  @GetMapping("/metrics")
  public DashboardMetricsDTO metrics() {
    return service.getMetrics();
  }

  @GetMapping("/weekly")
  public List<WeeklyPointDTO> weekly(@RequestParam(defaultValue = "7") int days) {
    return service.getWeekly(days);
  }

  @GetMapping("/top-products")
  public List<TopProductDTO> topProducts(@RequestParam(defaultValue = "5") int limit) {
    return service.getTopProducts(limit);
  }
}
