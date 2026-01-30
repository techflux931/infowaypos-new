package com.pos.service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.pos.dto.ReturnRequest;
import com.pos.model.ReturnTxn;
import com.pos.repository.ReturnTxnRepository;

@Service
public class ReturnService {

  private final ReturnTxnRepository repo;

  public ReturnService(ReturnTxnRepository repo) {
    this.repo = repo;
  }

  /** Create and persist a ReturnTxn from an incoming request. */
  public ReturnTxn create(ReturnRequest req) {
    if ((req.getItems() == null || req.getItems().isEmpty()) && (req.getAmount() == null)) {
      throw new IllegalArgumentException("Return requires either items or amount.");
    }

    ReturnTxn tx = new ReturnTxn();
    tx.setDate(new Date());
    tx.setSaleId(req.getSaleId());
    tx.setCustomerId(req.getCustomerId());
    tx.setCustomerName(req.getCustomerName());
    tx.setReason(req.getReason());

    // approver (optional)
    tx.setApproverId(req.getApproverId());
    tx.setApproverName(req.getApproverName());
    tx.setApproverUsername(req.getApproverUsername());

    // lines + totals
    if (req.getItems() != null && !req.getItems().isEmpty()) {
      List<ReturnTxn.Item> items = req.getItems().stream().map(i -> {
        ReturnTxn.Item it = new ReturnTxn.Item();
        it.setProductId(i.getProductId());
        it.setName(i.getName());
        it.setQty(safeNonNeg(i.getQty()));
        it.setAmount(round2(i.getAmount()));
        return it;
      }).collect(Collectors.toList());

      tx.setItems(items);
      double total = items.stream().mapToDouble(ReturnTxn.Item::getAmount).sum();
      tx.setAmount(round2(total));
    } else {
      tx.setAmount(round2(safeNonNeg(req.getAmount())));
    }

    return repo.save(tx);
  }

  /** List all returns, newest first. */
  public List<ReturnTxn> list() {
    return repo.findAll(Sort.by(Sort.Direction.DESC, "date"));
  }

  /** Fetch a single return or throw if not found. */
  public ReturnTxn get(String id) {
    return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
  }

  private static double round2(double v) {
    return Math.round(v * 100.0) / 100.0;
  }

  private static double safeNonNeg(Double v) {
    double x = (v == null ? 0d : v);
    return x < 0 ? 0 : x;
  }
}
