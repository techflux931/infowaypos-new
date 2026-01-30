package com.pos.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "company")  // keep "company" to match Atlas collection
public class Company {

    @Id
    private String id;

    // Legacy single-shop support
    private String shopId;

    // Company info
    private String name;
    private String trn;
    private String address;
    private String pincode;
    private String phone;
    private String mobile;
    private String email;
    private String logoUrl;

    // Access control
    private String adminUsername;
    private String clientUsername;

    // Shops (branches)
    private List<Shop> shops = new ArrayList<>();

    // ---------------- Getters / Setters ----------------
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getShopId() { return shopId; }
    public void setShopId(String shopId) { this.shopId = shopId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTrn() { return trn; }
    public void setTrn(String trn) { this.trn = trn; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public List<Shop> getShops() { return shops; }
    public void setShops(List<Shop> shops) {
        this.shops = (shops != null) ? shops : new ArrayList<>();
    }

    @Override
    public String toString() {
        return "Company{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", trn='" + trn + '\'' +
                ", adminUsername='" + adminUsername + '\'' +
                ", clientUsername='" + clientUsername + '\'' +
                ", shops=" + shops +
                '}';
    }
}
