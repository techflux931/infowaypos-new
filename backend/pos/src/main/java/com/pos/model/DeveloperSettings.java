package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "developer_settings")
public class DeveloperSettings {

    @Id
    private String id;

    // Basic Info
    private String shopName;
    private String location;
    private String version;
    private String amcExpiry;
    private int shopsCount;
    private int usersCount;

    // Contact Info
    private String phone;
    private String trn;
    private String email;

    // Last Login
    private String lastLoginAdmin;
    private String lastLoginCashier;
    private String lastLoginDeveloper;

    // Device & IP
    private String ipAddress;
    private String deviceInfo;

    // Multiple Shops List
    private List<ShopInfo> shopsList;

    // Pole Scale Settings
    private boolean scaleEmbedPrice;
    private boolean autoShowOnPole;

    // ===== Constructors =====
    public DeveloperSettings() {}

    // ===== Getters and Setters =====
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getAmcExpiry() { return amcExpiry; }
    public void setAmcExpiry(String amcExpiry) { this.amcExpiry = amcExpiry; }

    public int getShopsCount() { return shopsCount; }
    public void setShopsCount(int shopsCount) { this.shopsCount = shopsCount; }

    public int getUsersCount() { return usersCount; }
    public void setUsersCount(int usersCount) { this.usersCount = usersCount; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getTrn() { return trn; }
    public void setTrn(String trn) { this.trn = trn; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getLastLoginAdmin() { return lastLoginAdmin; }
    public void setLastLoginAdmin(String lastLoginAdmin) { this.lastLoginAdmin = lastLoginAdmin; }

    public String getLastLoginCashier() { return lastLoginCashier; }
    public void setLastLoginCashier(String lastLoginCashier) { this.lastLoginCashier = lastLoginCashier; }

    public String getLastLoginDeveloper() { return lastLoginDeveloper; }
    public void setLastLoginDeveloper(String lastLoginDeveloper) { this.lastLoginDeveloper = lastLoginDeveloper; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public List<ShopInfo> getShopsList() { return shopsList; }
    public void setShopsList(List<ShopInfo> shopsList) { this.shopsList = shopsList; }

    public boolean isScaleEmbedPrice() { return scaleEmbedPrice; }
    public void setScaleEmbedPrice(boolean scaleEmbedPrice) { this.scaleEmbedPrice = scaleEmbedPrice; }

    public boolean isAutoShowOnPole() { return autoShowOnPole; }
    public void setAutoShowOnPole(boolean autoShowOnPole) { this.autoShowOnPole = autoShowOnPole; }

    // ===== Inner Class =====
    public static class ShopInfo {
        private String name;
        private String location;
        private String lastLogin;
        private String amcExpiry;

        public ShopInfo() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getLastLogin() { return lastLogin; }
        public void setLastLogin(String lastLogin) { this.lastLogin = lastLogin; }

        public String getAmcExpiry() { return amcExpiry; }
        public void setAmcExpiry(String amcExpiry) { this.amcExpiry = amcExpiry; }
    }
}
