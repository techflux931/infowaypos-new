// src/main/java/com/pos/util/InvoiceXmlBuilder.java
package com.pos.util;

import java.text.SimpleDateFormat;
import java.util.Date;

import com.pos.model.Invoice;

public final class InvoiceXmlBuilder {

    private static final SimpleDateFormat ISO =
            new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

    private InvoiceXmlBuilder() {}

    public static String toXml(Invoice inv) {
        String issueDate = format(inv.getDate());
        String sellerName = safe(inv.getSellerName());
        String trn = safe(inv.getTrn());
        String customerName = safe(inv.getCustomerName());
        String customerPhone = safe(inv.getCustomerPhone());
        String invoiceNo = safe(inv.getInvoiceNo());
        String paymentType = safe(inv.getPaymentType());
        double total = inv.getNetTotal(); // incl. VAT
        double vat = inv.getVat();
        String qr = safe(inv.getEInvoiceQr());

        StringBuilder sb = new StringBuilder(1024);
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<InvoiceEInvoice xmlns=\"urn:uae:fta:e-invoice\">\n");

        sb.append("  <SellerName>").append(escape(sellerName)).append("</SellerName>\n");
        sb.append("  <TRN>").append(escape(trn)).append("</TRN>\n");
        sb.append("  <IssueDate>").append(escape(issueDate)).append("</IssueDate>\n");
        sb.append("  <InvoiceNo>").append(escape(invoiceNo)).append("</InvoiceNo>\n");

        sb.append("  <CustomerName>").append(escape(customerName)).append("</CustomerName>\n");
        sb.append("  <CustomerPhone>").append(escape(customerPhone)).append("</CustomerPhone>\n");

        sb.append("  <PaymentType>").append(escape(paymentType)).append("</PaymentType>\n");
        sb.append("  <TotalAmount>").append(String.format("%.2f", total)).append("</TotalAmount>\n");
        sb.append("  <VATAmount>").append(String.format("%.2f", vat)).append("</VATAmount>\n");

        // Base64 TLV payload used for QR
        sb.append("  <QrBase64>").append(escape(qr)).append("</QrBase64>\n");

        sb.append("</InvoiceEInvoice>\n");
        return sb.toString();
    }

    private static String format(Date d) {
        return (d == null) ? "" : ISO.format(d);
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
