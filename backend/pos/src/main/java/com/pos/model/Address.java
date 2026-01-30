package com.pos.model;

public class Address {
    private String attention;
    private String addressLine;
    private String street;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String poBox;

    public String getAttention() { return attention; }
    public void setAttention(String attention) { this.attention = attention; }
    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPoBox() { return poBox; }
    public void setPoBox(String poBox) { this.poBox = poBox; }
}
