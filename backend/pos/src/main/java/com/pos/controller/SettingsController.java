// src/main/java/com/pos/controller/SettingsController.java
package com.pos.controller;

import com.pos.model.PosSettings;
import com.pos.repository.PosSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

  private final PosSettingsRepository repo;
  private static final String ID = "default"; // change to shopId if multi-tenant

  @Autowired
  public SettingsController(PosSettingsRepository repo) {
    this.repo = repo;
  }

  private PosSettings mustLoad() {
    return repo.findById(ID).orElseGet(() -> {
      PosSettings s = new PosSettings();
      s.setId(ID);
      return repo.save(s);
    });
  }

  // -------- General --------
  @GetMapping("/general")
  public PosSettings.General getGeneral() {
    return mustLoad().getGeneral();
  }

  @PutMapping("/general")
  public PosSettings.General saveGeneral(@RequestBody PosSettings.General body) {
    PosSettings s = mustLoad();
    s.setGeneral(body);
    repo.save(s);
    return s.getGeneral();
  }

  // -------- POS --------
  @GetMapping("/pos")
  public PosSettings.Pos getPos() {
    return mustLoad().getPos();
  }

  @PutMapping("/pos")
  public PosSettings.Pos savePos(@RequestBody PosSettings.Pos body) {
    PosSettings s = mustLoad();
    s.setPos(body);
    repo.save(s);
    return s.getPos();
  }

  // -------- Tax --------
  @GetMapping("/tax")
  public PosSettings.Tax getTax() {
    return mustLoad().getTax();
  }

  @PutMapping("/tax")
  public PosSettings.Tax saveTax(@RequestBody PosSettings.Tax body) {
    PosSettings s = mustLoad();
    s.setTax(body);
    repo.save(s);
    return s.getTax();
  }

  // -------- Invoice --------
  @GetMapping("/invoice")
  public PosSettings.Invoice getInvoice() {
    return mustLoad().getInvoice();
  }

  @PutMapping("/invoice")
  public PosSettings.Invoice saveInvoice(@RequestBody PosSettings.Invoice body) {
    PosSettings s = mustLoad();
    s.setInvoice(body);
    repo.save(s);
    return s.getInvoice();
  }

  // Health probe (optional)
  @GetMapping("/ping")
  public ResponseEntity<String> ping() {
    return ResponseEntity.ok("ok");
  }
}
