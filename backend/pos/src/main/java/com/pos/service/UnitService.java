package com.pos.service;

import com.pos.model.Unit;
import java.util.List;

public interface UnitService {
    Unit saveUnit(Unit unit);
    List<Unit> getAllUnits();
    void deleteUnit(String id);
}
