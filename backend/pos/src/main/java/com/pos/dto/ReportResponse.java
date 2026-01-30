package com.pos.dto;

import java.util.List;
import java.util.Map;

/** Generic wrapper for report results with items, totals, and count */
public class ReportResponse<T> {
  private List<T> items;
  private Map<String, Object> totals;
  private long count;

  public ReportResponse() {}

  public ReportResponse(List<T> items, Map<String, Object> totals, long count) {
    this.items = items;
    this.totals = totals;
    this.count = count;
  }

  public List<T> getItems() { return items; }
  public void setItems(List<T> items) { this.items = items; }

  public Map<String, Object> getTotals() { return totals; }
  public void setTotals(Map<String, Object> totals) { this.totals = totals; }

  public long getCount() { return count; }
  public void setCount(long count) { this.count = count; }
}
