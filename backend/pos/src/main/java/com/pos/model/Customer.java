package com.pos.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "customers")
public class Customer {

    @Id
    private String id;

    // Basic Info
    private String code;
    private String firstName;
    private String lastName;
    private String email;
    private String mobileNo;
    private String phoneNo;

    // Address Info
    private String addressType;
    private String address;
    private String place;
    private String state;
    private String nationality;

    // Business Info
    private String day;
    private String dispenser;
    private String bottle;
    private String trn;
    private String contactPerson;
    private String creditPeriod;
    private String creditAmount;
    private String joinDate;
    private String customerType;
    private String remark;

    // ----------------- Computed Fields for Frontend -----------------

    @JsonProperty("name")
    public String getName() {
        String fullName = "";
        if (firstName != null) fullName += firstName;
        if (lastName != null && !lastName.isBlank()) fullName += " " + lastName;
        return fullName.trim();
    }

    @JsonProperty("phone")
    public String getPhone() {
        return (mobileNo != null && !mobileNo.isBlank()) ? mobileNo : phoneNo;
    }

    @JsonProperty("type")
    public String getType() {
        return customerType;
    }

    // ----------------- Getters & Setters -----------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }

    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }

    public String getAddressType() { return addressType; }
    public void setAddressType(String addressType) { this.addressType = addressType; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getDispenser() { return dispenser; }
    public void setDispenser(String dispenser) { this.dispenser = dispenser; }

    public String getBottle() { return bottle; }
    public void setBottle(String bottle) { this.bottle = bottle; }

    public String getTrn() { return trn; }
    public void setTrn(String trn) { this.trn = trn; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getCreditPeriod() { return creditPeriod; }
    public void setCreditPeriod(String creditPeriod) { this.creditPeriod = creditPeriod; }

    public String getCreditAmount() { return creditAmount; }
    public void setCreditAmount(String creditAmount) { this.creditAmount = creditAmount; }

    public String getJoinDate() { return joinDate; }
    public void setJoinDate(String joinDate) { this.joinDate = joinDate; }

    public String getCustomerType() { return customerType; }
    public void setCustomerType(String customerType) { this.customerType = customerType; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
