package com.pos.controller;

import com.pos.dto.CashIODto;
import com.pos.dto.CashTotalsDto;
import com.pos.service.ShiftService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/shift")
@CrossOrigin(origins = "*")
public class ShiftController {

  private final ShiftService svc;
  public ShiftController(ShiftService svc) { this.svc = svc; }

  @PostMapping("/x-report")
  public Map<String,String> xReport() {
    svc.logX();
    return Map.of("status", "ok");
  }

  @PostMapping("/z-report")
  public Map<String,String> zReport() {
    svc.logZ();
    return Map.of("status", "ok");
  }

  @PostMapping("/cash-in")
  public Map<String,String> cashIn(@RequestBody CashIODto dto) {
    svc.cashIn(dto.getAmount(), dto.getNote());
    return Map.of("status", "ok");
  }

  @PostMapping("/cash-out")
  public Map<String,String> cashOut(@RequestBody CashIODto dto) {
    svc.cashOut(dto.getAmount(), dto.getNote());
    return Map.of("status", "ok");
  }

  @GetMapping("/cash-totals")
  public CashTotalsDto cashTotals(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return svc.cashTotals(from, to);
  }

  /* Simple error body for UI */
  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String,String> onError(Exception e) {
    return Map.of("message", e.getMessage() == null ? "Server error" : e.getMessage());
  }
}
