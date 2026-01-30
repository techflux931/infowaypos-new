package com.pos.dto;

public record LedgerRow(
        String id,
        String name,
        String groupId,
        String groupName,          // resolved from AccountGroup.name
        Double openingBalance,     // keep Double to match your entity
        String balanceType,        // "DEBIT" | "CREDIT"
        boolean costCenterApplicable,
        String remark
) {}
