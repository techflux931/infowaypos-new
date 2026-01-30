// src/main/java/com/pos/payments/HttpBridgeTerminalClient.java
package com.pos.payments;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.pos.payments.dto.CardChargeRequest;
import com.pos.payments.dto.CardChargeResult;

@Component
public class HttpBridgeTerminalClient implements TerminalClient {

    private final RestTemplate http = new RestTemplate();

    @Value("${terminal.host}")
    private String host;

    @Value("${terminal.port:8081}")
    private int port;

    @Value("${terminal.apiKey:}")
    private String apiKey; // if your bridge uses an API key

    @Override
    public CardChargeResult charge(CardChargeRequest req) {
        String url = "http://" + host + ":" + port + "/charge";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isBlank()) headers.set("X-API-Key", apiKey);

        HttpEntity<CardChargeRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<CardChargeResult> resp =
                    http.postForEntity(url, entity, CardChargeResult.class);
            return resp.getBody() != null
                    ? resp.getBody()
                    : new CardChargeResult(false, "ERROR", "Empty response from terminal", null, null, null, null, null);
        } catch (Exception e) {
            return new CardChargeResult(false, "ERROR", "Terminal call failed: " + e.getMessage(), null, null, null, null, null);
        }
    }
}
