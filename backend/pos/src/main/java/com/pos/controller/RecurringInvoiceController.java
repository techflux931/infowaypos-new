package com.pos.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pos.model.RecurringInvoice;
import com.pos.service.RecurringInvoiceService;
import com.pos.dto.RecurringHistoryDTO;

@RestController
@RequestMapping("/api/sales/recurring-invoices")
@CrossOrigin(origins = "*")
public class RecurringInvoiceController {

  private final RecurringInvoiceService service;

  public RecurringInvoiceController(RecurringInvoiceService service) {
    this.service = service;
  }

  @GetMapping
  public List<RecurringInvoice> list() {
    return service.findAll();
  }

  @GetMapping("/{id}")
  public ResponseEntity<RecurringInvoice> get(@PathVariable String id) {
    return service.findById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public RecurringInvoice create(@RequestBody RecurringInvoice r) {
    return service.create(r);
  }

  @PutMapping("/{id}")
  public RecurringInvoice update(@PathVariable String id, @RequestBody RecurringInvoice r) {
    return service.update(id, r);
  }

  @PatchMapping("/{id}/pause")
  public RecurringInvoice pause(@PathVariable String id) {
    return service.pause(id);
  }

  @PatchMapping("/{id}/resume")
  public RecurringInvoice resume(@PathVariable String id) {
    return service.resume(id);
  }

  @PostMapping("/{id}/run-now")
  public ResponseEntity<Void> runNow(@PathVariable String id) {
    service.runNow(id);
    return ResponseEntity.accepted().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/_run-due")
  public ResponseEntity<Integer> runDue() {
    return ResponseEntity.ok(service.runDueToday());
  }

  // History endpoint
  @GetMapping("/{id}/history")
  public List<RecurringHistoryDTO> history(
      @PathVariable("id") String templateId,
      @RequestParam(name = "limit", defaultValue = "50") int limit) {
    return service.history(templateId, limit); // returns List<RecurringHistoryDTO>
  }
}
