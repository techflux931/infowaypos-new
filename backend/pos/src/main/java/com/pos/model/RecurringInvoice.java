package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Document("recurring_invoices")
public class RecurringInvoice {

    public enum Frequency { DAILY, WEEKLY, MONTHLY }
    public enum Status { ACTIVE, PAUSED, ENDED }

    @Id
    private String id;

    @Indexed
    private String invoiceNoPrefix = "RI-";

    private String customerId;
    private String customerName;

    private List<SaleItem> items;

    private LocalDate startDate;
    private LocalDate endDate;          // optional
    private Frequency frequency;        // DAILY/WEEKLY/MONTHLY
    private int interval = 1;           // every N units
    private Integer dayOfMonth;         // for MONTHLY (1..28)
    private LocalDate nextRunDate;      // scheduler pointer

    private Status status = Status.ACTIVE;
    private LocalDate lastRunDate;

    private String timezone = "Asia/Dubai";

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    // ---- getters/setters ----
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInvoiceNoPrefix() { return invoiceNoPrefix; }
    public void setInvoiceNoPrefix(String invoiceNoPrefix) { this.invoiceNoPrefix = invoiceNoPrefix; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public List<SaleItem> getItems() { return items; }
    public void setItems(List<SaleItem> items) { this.items = items; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Frequency getFrequency() { return frequency; }
    public void setFrequency(Frequency frequency) { this.frequency = frequency; }

    public int getInterval() { return interval; }
    public void setInterval(int interval) { this.interval = interval; }

    public Integer getDayOfMonth() { return dayOfMonth; }
    public void setDayOfMonth(Integer dayOfMonth) { this.dayOfMonth = dayOfMonth; }

    public LocalDate getNextRunDate() { return nextRunDate; }
    public void setNextRunDate(LocalDate nextRunDate) { this.nextRunDate = nextRunDate; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDate getLastRunDate() { return lastRunDate; }
    public void setLastRunDate(LocalDate lastRunDate) { this.lastRunDate = lastRunDate; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
