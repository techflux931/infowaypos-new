package com.pos.job;

import com.pos.service.RecurringInvoiceService; // <-- change to your actual package if different
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringInvoiceScheduler {

  private final RecurringInvoiceService service;

  public RecurringInvoiceScheduler(RecurringInvoiceService service) {
    this.service = service;
  }

  @Scheduled(cron = "0 5 3 * * *", zone = "Asia/Dubai")
  public void runDaily() {
    int n = service.runDueToday();
    if (n > 0) {
      System.out.println("[RecurringInvoiceScheduler] Generated " + n + " invoice(s).");
    }
  }
}
