package com.pos.controller;

import com.pos.model.Unit;
import com.pos.service.UnitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@CrossOrigin(origins = "*")
public class UnitController {

    @Autowired
    private UnitService unitService;

    // ✅ Create new unit
    @PostMapping
    public Unit addUnit(@RequestBody Unit unit) {
        return unitService.saveUnit(unit);
    }

    // ✅ Get all units
    @GetMapping
    public List<Unit> getAllUnits() {
        return unitService.getAllUnits();
    }

    // ✅ Update existing unit
    @PutMapping("/{id}")
    public Unit updateUnit(@PathVariable String id, @RequestBody Unit unit) {
        unit.setId(id); // Ensure ID is set
        return unitService.saveUnit(unit);
    }

    // ✅ Delete unit
    @DeleteMapping("/{id}")
    public void deleteUnit(@PathVariable String id) {
        unitService.deleteUnit(id);
    }
}
