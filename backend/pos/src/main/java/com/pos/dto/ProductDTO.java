package com.pos.dto;

import com.pos.model.Product;

public class ProductDTO {
    private String id;
    private String barcode;
    private String name;
    private String arabicName;
    private String category;
    private String unit;
    private double cost;
    private double margin;
    private double price;
    private double tax;
    private boolean taxable;
    private boolean active;

    // Convert Entity to DTO
    public static ProductDTO fromEntity(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.id = product.getId();
        dto.barcode = product.getBarcode();
        dto.name = product.getName();
        dto.arabicName = product.getArabicName();
        dto.category = product.getCategory();
        dto.unit = product.getUnit();
        dto.cost = product.getCost();
        dto.margin = product.getMargin();
        dto.price = product.getPrice();
        dto.tax = product.getTax();
        dto.taxable = product.isTaxable();
        dto.active = product.isActive();
        return dto;
    }

    // Convert DTO to Entity
    public Product toEntity() {
        Product p = new Product();
        p.setId(this.id);
        p.setBarcode(this.barcode);
        p.setName(this.name);
        p.setArabicName(this.arabicName);
        p.setCategory(this.category);
        p.setUnit(this.unit);
        p.setCost(this.cost);
        p.setMargin(this.margin);
        p.setPrice(this.price);
        p.setTax(this.tax);
        p.setTaxable(this.taxable);
        p.setActive(this.active);
        return p;
    }

    // Getters and Setters (or use Lombok if enabled)
    // ...
}
