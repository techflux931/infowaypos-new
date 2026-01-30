package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;

@Document("ledgers")
public class LedgerEntry {
    @Id
    private String id;

    public enum EntityType { CUSTOMER, VENDOR }
    public enum RefType { INVOICE, RETURN, PAYMENT, PURCHASE, EXPENSE, OPENING }

    private EntityType entityType;
    private String entityId;
    private String entityName;

    private RefType refType;
    private String refId;
    private LocalDate date;

    private BigDecimal debit;
    private BigDecimal credit;
    private String notes;

    public LedgerEntry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public EntityType getEntityType() { return entityType; }
    public void setEntityType(EntityType entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public RefType getRefType() { return refType; }
    public void setRefType(RefType refType) { this.refType = refType; }

    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit; }

    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
