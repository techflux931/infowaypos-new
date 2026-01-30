package com.pos.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Date;
import java.util.Locale;
import java.util.Objects;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import com.pos.model.Invoice;
import com.pos.model.InvoiceItem;

public final class InvoicePDFGenerator {
  private InvoicePDFGenerator() {}

  // A4 version
  public static byte[] generateA4(Invoice inv) {
    return build(inv, PDRectangle.A4);
  }

  // 80mm thermal-like version
  public static byte[] generateThermal(Invoice inv) {
    // ~80mm -> 226.8pt, height arbitrary (auto-expand not trivial with single page)
    return build(inv, new PDRectangle(226.8f, 600f));
  }

  // -- main builder ----------------------------------------------------------

  private static byte[] build(Invoice inv, PDRectangle pageSize) {
    float pageW = pageSize.getWidth();
    float pageH = pageSize.getHeight();

    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PDPage page = new PDPage(pageSize);
      doc.addPage(page);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        float margin = 36f;
        float y = pageH - margin;
        float lh = 14f;

        // Title
        cs.setFont(PDType1Font.HELVETICA_BOLD, 16);
        String title = "INVOICE";
        float tw = PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000f * 16f;
        cs.beginText();
        cs.newLineAtOffset((pageW - tw) / 2f, y);
        cs.showText(title);
        cs.endText();
        y -= (lh + 6);

        // Header meta
        cs.setFont(PDType1Font.HELVETICA, 10);

        String invoiceNo = strOrEmpty(invokeAny(inv,
            "getNumber", "getInvoiceNumber", "getNo", "getCode", "getId"));
        y = textRow(cs, margin, y, "Invoice No:", invoiceNo);

        String dateText = formatDate(invokeAny(inv, "getDate", "getInvoiceDate", "getCreatedAt", "getCreatedOn"));
        y = textRow(cs, margin, y, "Date:", dateText);

        String customer = strOrEmpty(invokeAny(inv, "getCustomerName", "getCustomer", "getClientName", "getClient"));
        y = textRow(cs, margin, y, "Customer:", customer);

        y -= 8;
        hr(cs, margin, pageW - margin, y); y -= 10;

        // Table header
        float[] colX = {margin, margin + 260, margin + 360, margin + 430, pageW - margin};
        y = tableHeader(cs, y, colX, "Item", "Qty", "Price", "Amount");

        // Items
        cs.setFont(PDType1Font.HELVETICA, 10);
        Collection<InvoiceItem> items = safeItems(inv);
        for (InvoiceItem it : items) {
          String name = strOrEmpty(invokeAny(it, "getName", "getTitle", "getProductName", "getItemName", "getSku"));
          double qty = numOrZero(invokeAny(it, "getQuantity", "getQty", "getCount", "getUnits"));
          double unitPrice = numOrZero(invokeAny(it, "getUnitPrice", "getPrice", "getRate", "getUnitCost"));
          double lineTotal = hasAny(it, "getTotal", "getLineTotal", "getAmount")
              ? numOrZero(invokeAny(it, "getTotal", "getLineTotal", "getAmount"))
              : qty * unitPrice;

          y = tableRow(cs, y, colX, name, fmt(qty), fmt(unitPrice), fmt(lineTotal));
        }

        y -= 8;
        hr(cs, margin, pageW - margin, y); y -= 10;

        // Totals — try to read from Invoice; compute if missing
        double subtotal = hasAny(inv, "getSubTotal", "getSubtotal", "getTotalBeforeTax")
            ? numOrZero(invokeAny(inv, "getSubTotal", "getSubtotal", "getTotalBeforeTax"))
            : items.stream()
                   .mapToDouble(it -> {
                     double q = numOrZero(invokeAny(it, "getQuantity", "getQty", "getCount", "getUnits"));
                     double p = hasAny(it, "getUnitPrice", "getPrice", "getRate", "getUnitCost")
                         ? numOrZero(invokeAny(it, "getUnitPrice", "getPrice", "getRate", "getUnitCost"))
                         : 0.0;
                     double t = hasAny(it, "getTotal", "getLineTotal", "getAmount")
                         ? numOrZero(invokeAny(it, "getTotal", "getLineTotal", "getAmount"))
                         : q * p;
                     return t;
                   })
                   .sum();

        double tax = hasAny(inv, "getTax", "getVat", "getGst", "getTaxAmount")
            ? numOrZero(invokeAny(inv, "getTax", "getVat", "getGst", "getTaxAmount"))
            : 0.0;

        double grand = hasAny(inv, "getGrandTotal", "getTotal", "getAmountDue", "getNetTotal")
            ? numOrZero(invokeAny(inv, "getGrandTotal", "getTotal", "getAmountDue", "getNetTotal"))
            : subtotal + tax;

        y = textRowRight(cs, margin, y, pageW - margin, "Subtotal:", fmt(subtotal));
        y = textRowRight(cs, margin, y, pageW - margin, "Tax:", fmt(tax));
        y = textRowRightBold(cs, margin, y, pageW - margin, "Grand Total:", fmt(grand));
      }

      doc.save(baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException("Failed to generate invoice PDF", e);
    }
  }

  // -- small PDF helpers -----------------------------------------------------

  private static String safe(String s) { return s == null ? "" : s; }
  private static String fmt(double n) { return String.format(Locale.US, "%,.2f", n); }

  private static float textRow(PDPageContentStream cs, float x, float y, String l, String r) throws IOException {
    float right = PDRectangle.A4.getWidth() - 36f; // keep consistent alignment on A4-like width
    float size = 10f;

    cs.setFont(PDType1Font.HELVETICA, size);
    cs.beginText(); cs.newLineAtOffset(x, y); cs.showText(l); cs.endText();

    float tw = PDType1Font.HELVETICA.getStringWidth(r) / 1000f * size;
    cs.beginText(); cs.newLineAtOffset(right - tw, y); cs.showText(r); cs.endText();

    return y - 14f;
  }

  private static float textRowRight(PDPageContentStream cs, float x, float y, float right, String l, String r) throws IOException {
    float size = 10f;
    float lw = PDType1Font.HELVETICA.getStringWidth(l) / 1000f * size;
    cs.setFont(PDType1Font.HELVETICA, size);
    cs.beginText(); cs.newLineAtOffset(right - lw - 120, y); cs.showText(l); cs.endText();

    float rw = PDType1Font.HELVETICA.getStringWidth(r) / 1000f * size;
    cs.beginText(); cs.newLineAtOffset(right - rw, y); cs.showText(r); cs.endText();

    return y - 14f;
  }

  private static float textRowRightBold(PDPageContentStream cs, float x, float y, float right, String l, String r) throws IOException {
    float size = 11f;
    float lw = PDType1Font.HELVETICA_BOLD.getStringWidth(l) / 1000f * size;
    cs.setFont(PDType1Font.HELVETICA_BOLD, size);
    cs.beginText(); cs.newLineAtOffset(right - lw - 120, y); cs.showText(l); cs.endText();

    float rw = PDType1Font.HELVETICA_BOLD.getStringWidth(r) / 1000f * size;
    cs.beginText(); cs.newLineAtOffset(right - rw, y); cs.showText(r); cs.endText();

    return y - 16f;
  }

  private static float tableHeader(PDPageContentStream cs, float y, float[] x, String c1, String c2, String c3, String c4) throws IOException {
    cs.setFont(PDType1Font.HELVETICA_BOLD, 10);
    cs.beginText(); cs.newLineAtOffset(x[0], y); cs.showText(c1); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[1], y); cs.showText(c2); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[2], y); cs.showText(c3); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[3], y); cs.showText(c4); cs.endText();
    return y - 16f;
  }

  private static float tableRow(PDPageContentStream cs, float y, float[] x, String c1, String c2, String c3, String c4) throws IOException {
    cs.setFont(PDType1Font.HELVETICA, 10);
    cs.beginText(); cs.newLineAtOffset(x[0], y); cs.showText(c1); cs.endText();

    cs.beginText(); cs.newLineAtOffset(x[1], y); cs.showText(c2); cs.endText();

    float tw3 = PDType1Font.HELVETICA.getStringWidth(c3) / 1000f * 10f;
    cs.beginText(); cs.newLineAtOffset(x[3] - 70 - tw3, y); cs.showText(c3); cs.endText();

    float tw4 = PDType1Font.HELVETICA.getStringWidth(c4) / 1000f * 10f;
    cs.beginText(); cs.newLineAtOffset(x[4] - tw4, y); cs.showText(c4); cs.endText();

    return y - 14f;
  }

  private static void hr(PDPageContentStream cs, float x1, float x2, float y) throws IOException {
    cs.moveTo(x1, y);
    cs.lineTo(x2, y);
    cs.stroke();
  }

  // -- model adapters (no hard dependency on exact getter names) -------------

  @SuppressWarnings("unchecked")
  private static Collection<InvoiceItem> safeItems(Invoice inv) {
    Object items = invokeAny(inv, "getItems", "getLines", "getDetails");
    if (items instanceof Collection<?> c) {
      return (Collection<InvoiceItem>) c;
    }
    return java.util.List.of();
  }

  private static String formatDate(Object dateObj) {
    if (dateObj == null) return "";
    if (dateObj instanceof String s) return s;
    if (dateObj instanceof LocalDate ld) return ld.format(DateTimeFormatter.ISO_DATE);
    if (dateObj instanceof LocalDateTime ldt) return ldt.toLocalDate().format(DateTimeFormatter.ISO_DATE);
    if (dateObj instanceof Date d) {
      LocalDate ld = Instant.ofEpochMilli(d.getTime()).atZone(ZoneId.systemDefault()).toLocalDate();
      return ld.format(DateTimeFormatter.ISO_DATE);
    }
    // Anything else -> string
    return String.valueOf(dateObj);
  }

  private static boolean hasAny(Object target, String... methodNames) {
    for (String m : methodNames) {
      try {
        Method mm = target.getClass().getMethod(m);
        if (mm != null) return true;
      } catch (NoSuchMethodException ignore) {
      }
    }
    return false;
  }

  private static Object invokeAny(Object target, String... methodNames) {
    for (String m : methodNames) {
      try {
        Method mm = target.getClass().getMethod(m);
        mm.setAccessible(true);
        return mm.invoke(target);
      } catch (ReflectiveOperationException ignore) {
      }
    }
    return null;
  }

  private static String strOrEmpty(Object o) {
    return o == null ? "" : String.valueOf(o);
  }

  private static double numOrZero(Object o) {
    if (o == null) return 0.0;
    if (o instanceof Number n) return n.doubleValue();
    try {
      return Double.parseDouble(Objects.toString(o));
    } catch (Exception e) {
      return 0.0;
    }
  }
}
