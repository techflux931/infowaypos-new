// src/main/java/com/pos/util/UaeEInvoiceQrDecoder.java
package com.pos.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public final class UaeEInvoiceQrDecoder {

    private UaeEInvoiceQrDecoder() {
    }

    public static Map<Integer, String> decode(String base64) {
        Map<Integer, String> out = new LinkedHashMap<>();
        if (base64 == null || base64.isBlank()) {
            return out;
        }

        byte[] bytes = Base64.getDecoder().decode(base64);
        int pos = 0;

        while (pos + 2 <= bytes.length) {
            int tag = bytes[pos++] & 0xFF;
            int len = bytes[pos++] & 0xFF;
            if (pos + len > bytes.length) break;

            String value = new String(bytes, pos, len, StandardCharsets.UTF_8);
            pos += len;
            out.put(tag, value);
        }
        return out;
    }
}
