package com.pos.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.DeliveryChallan;
import com.pos.repository.DeliveryChallanRepository;

@RestController
@RequestMapping("/api/deliverychallans")
@CrossOrigin(origins = "*")
public class DeliveryChallanController {

    @Autowired
    private DeliveryChallanRepository deliveryChallanRepository;

    @PostMapping
    public DeliveryChallan createChallan(@RequestBody DeliveryChallan challan) {
        return deliveryChallanRepository.save(challan);
    }

    @GetMapping
    public List<DeliveryChallan> getAllChallans() {
        return deliveryChallanRepository.findAll();
    }
}
