package com.pos.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "expenses")
@CompoundIndexes({
    // Useful for range queries with filters in reports/dashboards
    @CompoundIndex(name = "idx_expenses_date_category", def = "{'date':1,'category':1}"),
    @CompoundIndex(name = "idx_expenses_date_vendor",   def = "{'date':1,'vendor':1}")
})
public class Expense {

    @Id
    private String id;

    private String name;

    @Indexed
    private String category;

    @Indexed
    private String vendor;

    /** Always non-null for safe sums. */
    private BigDecimal amount = BigDecimal.ZERO;

    /** Business date of the expense (used by reports/KPI). */
    @Indexed
    private Date date;

    @Indexed
    private String paymentMethod; // Cash / Card / Transfer / Other

    private String description;

    private Address address;

    /** Never null to simplify UI binding. */
    private List<Attachment> attachments = new ArrayList<>();

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    /* -------- getters & setters (null-safe for amount/list) -------- */
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }

    public BigDecimal getAmount() { return nz(amount); }
    public void setAmount(BigDecimal amount) { this.amount = nz(amount); }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public List<Attachment> getAttachments() { return attachments; }
    public void setAttachments(List<Attachment> attachments) {
        this.attachments = (attachments == null) ? new ArrayList<>() : attachments;
    }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    /* -------- nested types -------- */
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zip;
        private String country;

        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getZip() { return zip; }
        public void setZip(String zip) { this.zip = zip; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }

    public static class Attachment {
        private String name;
        private long size;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public long getSize() { return size; }
        public void setSize(long size) { this.size = size; }
    }

    /* ---------------- helpers ---------------- */
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
