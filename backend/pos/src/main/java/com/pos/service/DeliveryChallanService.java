package com.pos.service;

import com.pos.model.DeliveryChallan;

import java.util.List;

public interface DeliveryChallanService {
    DeliveryChallan save(DeliveryChallan challan);
    List<DeliveryChallan> getAll();
    DeliveryChallan getById(String id);
    void delete(String id);
}
