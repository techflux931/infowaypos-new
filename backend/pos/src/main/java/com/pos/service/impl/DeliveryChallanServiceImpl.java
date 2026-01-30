package com.pos.service.impl;

import com.pos.model.DeliveryChallan;
import com.pos.repository.DeliveryChallanRepository;
import com.pos.service.DeliveryChallanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryChallanServiceImpl implements DeliveryChallanService {

    @Autowired
    private DeliveryChallanRepository repository;

    @Override
    public DeliveryChallan save(DeliveryChallan challan) {
        return repository.save(challan);
    }

    @Override
    public List<DeliveryChallan> getAll() {
        return repository.findAll();
    }

    @Override
    public DeliveryChallan getById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }
}
