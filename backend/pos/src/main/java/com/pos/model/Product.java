package com.pos.model;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {

    @Id
    private String id;

    /** Real barcode; optional -> unique + sparse allows multiple nulls */
    @Indexed(unique = true, sparse = true)
    private String barcode;

    /** Internal SKU/code; optional but unique when present */
    @Indexed(unique = true, sparse = true)
    private String code;

    /** 5-digit pole-scale code; optional and unique when present */
    @Indexed(unique = true, sparse = true)
    private String productCode;

    @Indexed private String name;
    @Indexed private String nameAr;

    // --- Pricing / costs ---
    private BigDecimal baseCost;     // cost before tax
    private BigDecimal costTax;      // cost VAT amount
    private BigDecimal netCost;      // baseCost + costTax
    private BigDecimal margin;       // percent (e.g. 15.00)
    private BigDecimal retail;       // base unit retail
    private BigDecimal wholesale;    // optional
    private BigDecimal creditPrice;  // optional (frontend maps "credit" -> creditPrice)
    private BigDecimal vatPercent;   // percent (e.g. 5.00)

    // --- Inventory / pack ---
    private BigDecimal packQty;      // e.g. 12 PCS/BOX or KG conversions
    private BigDecimal stock;        // current stock in base unit

    // --- Optional / categorization ---
    private String brand;
    private String bin;
    private String size;
    private String cupSize;
    private String prodGroup;
    private String category;
    /** Base unit, e.g., "PCS", "KG" */
    private String unit;

    /** If true, item appears in quick/direct sale tiles */
    private boolean directSale;

    /** Public/static URL of product image (used for direct sale tile) */
    private String imageUrl;

    /** Alternate units / pack sizes / barcodes */
    private List<SubItem> subItems;

    // kept for compatibility with existing UI/backoffice
    private String purchaseAcc;
    private String salesAcc;

    @CreatedDate    private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    /* =================== */
    /* Nested SubItem type */
    /* =================== */
    public static class SubItem {
        /** e.g., "BOX", "PCS", "500G" */
        private String unit;

        /** Conversion to base unit: 1 BOX = 12 PCS -> factor=12 */
        private BigDecimal factor;

        /** Optional barcode specific to this pack/unit */
        private String barcode;

        /** Retail for this unit (optional; if null, derive retail * factor) */
        private BigDecimal retail;

        /** Wholesale for this unit (optional) */
        private BigDecimal wholesale;

        // ---- getters/setters ----
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public BigDecimal getFactor() { return factor; }
        public void setFactor(BigDecimal factor) { this.factor = factor; }

        public String getBarcode() { return barcode; }
        public void setBarcode(String barcode) { this.barcode = barcode; }

        public BigDecimal getRetail() { return retail; }
        public void setRetail(BigDecimal retail) { this.retail = retail; }

        public BigDecimal getWholesale() { return wholesale; }
        public void setWholesale(BigDecimal wholesale) { this.wholesale = wholesale; }
    }

    // =====================
    // Getters / Setters
    // =====================
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameAr() { return nameAr; }
    public void setNameAr(String nameAr) { this.nameAr = nameAr; }

    public BigDecimal getBaseCost() { return baseCost; }
    public void setBaseCost(BigDecimal baseCost) { this.baseCost = baseCost; }

    public BigDecimal getCostTax() { return costTax; }
    public void setCostTax(BigDecimal costTax) { this.costTax = costTax; }

    public BigDecimal getNetCost() { return netCost; }
    public void setNetCost(BigDecimal netCost) { this.netCost = netCost; }

    public BigDecimal getMargin() { return margin; }
    public void setMargin(BigDecimal margin) { this.margin = margin; }

    public BigDecimal getRetail() { return retail; }
    public void setRetail(BigDecimal retail) { this.retail = retail; }

    public BigDecimal getWholesale() { return wholesale; }
    public void setWholesale(BigDecimal wholesale) { this.wholesale = wholesale; }

    public BigDecimal getCreditPrice() { return creditPrice; }
    public void setCreditPrice(BigDecimal creditPrice) { this.creditPrice = creditPrice; }

    public BigDecimal getVatPercent() { return vatPercent; }
    public void setVatPercent(BigDecimal vatPercent) { this.vatPercent = vatPercent; }

    public BigDecimal getPackQty() { return packQty; }
    public void setPackQty(BigDecimal packQty) { this.packQty = packQty; }

    public BigDecimal getStock() { return stock; }
    public void setStock(BigDecimal stock) { this.stock = stock; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getBin() { return bin; }
    public void setBin(String bin) { this.bin = bin; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getCupSize() { return cupSize; }
    public void setCupSize(String cupSize) { this.cupSize = cupSize; }

    public String getProdGroup() { return prodGroup; }
    public void setProdGroup(String prodGroup) { this.prodGroup = prodGroup; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public boolean isDirectSale() { return directSale; }
    public void setDirectSale(boolean directSale) { this.directSale = directSale; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<SubItem> getSubItems() { return subItems; }
    public void setSubItems(List<SubItem> subItems) { this.subItems = subItems; }

    public String getPurchaseAcc() { return purchaseAcc; }
    public void setPurchaseAcc(String purchaseAcc) { this.purchaseAcc = purchaseAcc; }

    public String getSalesAcc() { return salesAcc; }
    public void setSalesAcc(String salesAcc) { this.salesAcc = salesAcc; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
