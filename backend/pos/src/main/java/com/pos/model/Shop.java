package com.pos.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Shop {

    private String id;
    private String name;
    private String trn;
    private String pincode;
    private String phone;
    private boolean active = true;

    @JsonProperty("default") // frontend sends "default", map to defaultShop
    private boolean defaultShop;

    // ---------------- Getters / Setters ----------------
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTrn() { return trn; }
    public void setTrn(String trn) { this.trn = trn; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isDefaultShop() { return defaultShop; }
    public void setDefaultShop(boolean defaultShop) { this.defaultShop = defaultShop; }

    @Override
    public String toString() {
        return "Shop{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", trn='" + trn + '\'' +
                ", defaultShop=" + defaultShop +
                '}';
    }
}
