// src/main/java/com/pos/controller/TallySettingController.java
package com.pos.controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.TallySetting;
import com.pos.service.TallySettingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/integrations/tally/settings")
@CrossOrigin
@RequiredArgsConstructor
public class TallySettingController {
  private final TallySettingService svc;

  @GetMapping public TallySetting get(){ return svc.get(); }
  @PutMapping public TallySetting put(@RequestBody TallySetting s){ return svc.save(s); }
}
