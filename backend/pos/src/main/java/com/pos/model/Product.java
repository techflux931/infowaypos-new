package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {

    @Id
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

    // Getters and Setters
    // (Lombok can be used instead if preferred)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getArabicName() { return arabicName; }
    public void setArabicName(String arabicName) { this.arabicName = arabicName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public double getCost() { return cost; }
    public void setCost(double cost) { this.cost = cost; }

    public double getMargin() { return margin; }
    public void setMargin(double margin) { this.margin = margin; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getTax() { return tax; }
    public void setTax(double tax) { this.tax = tax; }

    public boolean isTaxable() { return taxable; }
    public void setTaxable(boolean taxable) { this.taxable = taxable; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
