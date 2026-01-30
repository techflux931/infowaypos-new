package com.pos.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional; // if you wire a TX manager

import com.pos.model.Hold;
import com.pos.model.Sale;
import com.pos.model.SaleItem;      // <-- IMPORTANT
import com.pos.repository.HoldRepository;
import com.pos.repository.SaleRepository;

@Service
public class HoldService {

    private final HoldRepository holds;
    private final SaleRepository sales;

    public HoldService(HoldRepository holds, SaleRepository sales) {
        this.holds = Objects.requireNonNull(holds, "holds");
        this.sales = Objects.requireNonNull(sales, "sales");
    }

    public Hold save(Hold hold) {
        Objects.requireNonNull(hold, "hold");
        if (hold.getDate() == null) hold.setDate(new Date());
        return holds.save(hold);
    }

    public Optional<Hold> find(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return holds.findById(id);
    }

    public void delete(String id) {
        if (id == null || id.isBlank()) return;
        holds.deleteById(id);
    }

    public Page<Hold> search(String q, Date from, Date to, Pageable pageable) {
        return holds.search(q, from, to, pageable);
    }

    /** Move a hold to sales and delete the hold. */
    // @Transactional
    public Sale commit(String holdId) {
        if (holdId == null || holdId.isBlank()) {
            throw new IllegalArgumentException("holdId is required");
        }

        Hold hold = holds.findById(holdId)
                .orElseThrow(() -> new IllegalArgumentException("Hold not found: " + holdId));

        Sale saved = sales.save(mapHoldToSale(hold));
        holds.deleteById(holdId);
        return saved;
    }

    private static Sale mapHoldToSale(Hold h) {
        Sale s = new Sale();
        s.setDate(new Date());
        s.setCashier(h.getCashier());
        s.setCustomerId(h.getCustomerId());
        s.setCustomerName(h.getCustomerName());
        s.setGrossTotal(h.getGrossTotal());
        s.setDiscount(h.getDiscount());
        s.setVat(h.getVat());
        s.setNetTotal(h.getNetTotal());

        List<SaleItem> items = h.getItems(); // must be List<SaleItem>
        if (items != null) {
            s.setItems(new ArrayList<SaleItem>(items)); // typed copy
        } else {
            s.setItems(new ArrayList<SaleItem>());
        }

        // s.setSourceHoldId(h.getId()); // optional traceability
        return s;
    }
}
