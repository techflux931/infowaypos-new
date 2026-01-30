// src/main/java/com/pos/payments/dto/CardChargeResult.java
package com.pos.payments.dto;

public record CardChargeResult(
        boolean approved,
        String status,        // "APPROVED"/"DECLINED"/"ERROR"
        String message,       // human readable
        String authCode,      // if approved
        String rrn,           // retrieval reference number, if any
        String maskedPan,     // 4111********1111
        String paymentId,     // saved Payment id (if approved)
        String saleId         // saved Sale id (if approved and you choose to save Sale)
) {}
