package com.pos.dto;

import com.pos.model.AccountNature;

public class GroupDTO {
    private Long id;
    private String name;
    private Long underAccountId;      // nullable
    private String underAccountName;  // for responses
    private AccountNature nature;     // ASSET/LIABILITY/INCOME/EXPENSE
    private boolean affectGrossProfit;
    private String remarks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getUnderAccountId() { return underAccountId; }
    public void setUnderAccountId(Long underAccountId) { this.underAccountId = underAccountId; }

    public String getUnderAccountName() { return underAccountName; }
    public void setUnderAccountName(String underAccountName) { this.underAccountName = underAccountName; }

    public AccountNature getNature() { return nature; }
    public void setNature(AccountNature nature) { this.nature = nature; }

    public boolean isAffectGrossProfit() { return affectGrossProfit; }
    public void setAffectGrossProfit(boolean affectGrossProfit) { this.affectGrossProfit = affectGrossProfit; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
