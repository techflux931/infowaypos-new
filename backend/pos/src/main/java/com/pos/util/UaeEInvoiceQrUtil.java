package com.pos.util;

import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Base64;
import java.util.Locale;

/**
 * UAE E-Invoice QR helper (FTA TLV format).
 *
 * Builds a Base64-encoded TLV payload with tags:
 *   1 = Seller name
 *   2 = TRN
 *   3 = Timestamp (ISO-8601)
 *   4 = Total amount (incl. VAT)
 *   5 = VAT amount
 */
public final class UaeEInvoiceQrUtil {

    // Ensure dot (.) as decimal separator, independent of OS locale
    private static final DecimalFormat TWO_DECIMALS;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setDecimalSeparator('.');
        TWO_DECIMALS = new DecimalFormat("0.00", symbols);
    }

    private UaeEInvoiceQrUtil() {
        // utility class – no instances
    }

    /**
     * Builds the Base64 QR payload for UAE e-invoice.
     *
     * @param sellerName   Seller legal name
     * @param trn          Tax Registration Number (TRN)
     * @param isoDateTime  Invoice issue time (ISO-8601 string: 2025-12-05T08:30:00Z)
     * @param totalAmount  Total amount including VAT
     * @param vatAmount    VAT amount
     * @return Base64-encoded TLV string
     */
    public static String buildQrPayload(
            String sellerName,
            String trn,
            String isoDateTime,
            double totalAmount,
            double vatAmount
    ) {
        byte[] f1 = tlv((byte) 1, sellerName);
        byte[] f2 = tlv((byte) 2, trn);
        byte[] f3 = tlv((byte) 3, isoDateTime);
        byte[] f4 = tlv((byte) 4, formatAmount(totalAmount));
        byte[] f5 = tlv((byte) 5, formatAmount(vatAmount));

        int len = f1.length + f2.length + f3.length + f4.length + f5.length;
        byte[] all = new byte[len];

        int pos = 0;
        for (byte[] field : new byte[][]{f1, f2, f3, f4, f5}) {
            System.arraycopy(field, 0, all, pos, field.length);
            pos += field.length;
        }

        return Base64.getEncoder().encodeToString(all);
    }

    // ---------- internal helpers ----------

    /** One TLV field: [TAG][LENGTH][VALUE...] */
    private static byte[] tlv(byte tag, String value) {
        String safeValue = (value == null) ? "" : value;
        byte[] vBytes = safeValue.getBytes(StandardCharsets.UTF_8);

        byte[] out = new byte[2 + vBytes.length];
        out[0] = tag;
        out[1] = (byte) vBytes.length;
        System.arraycopy(vBytes, 0, out, 2, vBytes.length);
        return out;
    }

    /** Format amount with 2 decimals using dot separator. */
    private static String formatAmount(double amount) {
        return TWO_DECIMALS.format(amount);
    }
}
