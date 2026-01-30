// src/main/java/com/pos/dto/GroupRequest.java
package com.pos.dto;

import jakarta.validation.constraints.NotBlank;

public class GroupRequest {
    @NotBlank
    private String name;

    // parent group id (nullable: root)
    private String underAccountId;

    @NotBlank
    private String nature; // ASSET|LIABILITY|INCOME|EXPENSE

    private Boolean affectGrossProfit;
    private String remarks;

    // getters/setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnderAccountId() { return underAccountId; }
    public void setUnderAccountId(String underAccountId) { this.underAccountId = underAccountId; }

    public String getNature() { return nature; }
    public void setNature(String nature) { this.nature = nature; }

    public Boolean getAffectGrossProfit() { return affectGrossProfit; }
    public void setAffectGrossProfit(Boolean affectGrossProfit) { this.affectGrossProfit = affectGrossProfit; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
