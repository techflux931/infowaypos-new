// src/main/java/com/pos/payments/TerminalClient.java
package com.pos.payments;

import com.pos.payments.dto.CardChargeRequest;
import com.pos.payments.dto.CardChargeResult;

public interface TerminalClient {
    CardChargeResult charge(CardChargeRequest request);
}
