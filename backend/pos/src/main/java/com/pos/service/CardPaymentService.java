// src/main/java/com/pos/service/CardPaymentService.java
package com.pos.service;

import com.pos.config.TwilioProperties;
import com.pos.payments.dto.CardChargeRequest;
import com.pos.payments.dto.CardChargeResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardPaymentService {

    private static final Logger log = LoggerFactory.getLogger(CardPaymentService.class);

    private final TwilioProperties twilio;

    @PostConstruct
    public void debug() {
        log.info("[Twilio] SID={}", twilio.getAccountSid());
        log.info("[Twilio] Token={}", twilio.getAuthToken());
        log.info("[Twilio] From={}", twilio.getFromNumber());
    }

    /** Simulated card charge. Replace with real terminal integration. */
    public CardChargeResult charge(CardChargeRequest req) {
        // Fix #1: BigDecimal compare
        boolean approved = req.amount() != null && req.amount().compareTo(BigDecimal.ZERO) > 0;

        String status    = approved ? "APPROVED" : "DECLINED";
        String message   = approved ? "Transaction successful" : "Invalid amount";
        String reference = req.reference() != null ? req.reference() : "";

        // Fill the remaining fields expected by your record (8 args total)
        String rrn        = UUID.randomUUID().toString(); // retrieval reference number
        String authCode   = approved ? String.format("%06d", (int)(Math.random()*1_000_000)) : "";
        String terminalId = "TERM-LOCAL";
        String txnId      = UUID.randomUUID().toString();

        // Fix #2: match your record signature: (boolean, String, String, String, String, String, String, String)
        return new CardChargeResult(
                approved,
                status,
                message,
                reference,
                rrn,
                authCode,
                terminalId,
                txnId
        );
    }
}
