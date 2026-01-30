package com.pos.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.bson.Document;
import org.springframework.stereotype.Service;

import com.pos.dto.ReportResponse;

/**
 * Generates a compact receipt-like X Report PDF using Apache PDFBox.
 */
@Service
public class XReportPdfService {

  private final ReportService reportService;

  public XReportPdfService(ReportService reportService) {
    this.reportService = reportService;
  }

  public byte[] buildXReportPdf(LocalDate date) {
    // ----- 1) Fetch the data -----
    ReportResponse<Document> resp =
        reportService.dayZ(date, date, null, "DAY", null, "ASC", 0, 1, false);

    List<Document> rows = extractDocs(resp);
    Document data = rows.isEmpty() ? new Document() : rows.get(0);

    Document totals   = getDoc(data, "totals");
    Document payments = getDoc(data, "payments");

    double gross   = getD(totals, "gross", getD(totals, "grossTotal", 0));
    double returns = getD(totals, "returns", 0);
    double vat     = getD(totals, "vat", getD(totals, "tax", 0));
    double net     = getD(totals, "net", getD(totals, "netTotal", 0));
    long   txns    = getL(data,   "count", getL(totals, "bills", 0));

    double cash    = getD(payments, "cash",   0);
    double card    = getD(payments, "card",   0);
    double credit  = getD(payments, "credit", 0);
    double other   = getD(payments, "other",  0);

    String storeName = "POS STORE";
    String printDate = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    String saleDate  = date.format(DateTimeFormatter.ISO_DATE);

    // ----- 2) Build a small 80mm-like page -----
    float pageW = 226.8f;  // ~80mm
    float pageH = 600f;
    PDRectangle rect = new PDRectangle(pageW, pageH);

    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PDPage page = new PDPage(rect);
      doc.addPage(page);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        Drawer d = new Drawer(cs, pageW);
        d.y = pageH - 24; // start Y

        // Header
        d.center(storeName, true); d.down();
        d.center("POS X REPORT", false); d.down();
        d.hr();

        // Meta
        d.row("Date", saleDate); d.down();
        d.row("Printed", printDate); d.down();
        d.row("Transactions", String.valueOf(txns)); d.down();
        d.hr();

        // Sales
        d.row("Gross",   "AED " + fmt(gross)); d.down();
        d.row("Returns", "AED " + fmt(returns)); d.down();
        d.row("VAT",     "AED " + fmt(vat)); d.down();
        d.rowBold("Net", "AED " + fmt(net)); d.down();
        d.hr();

        // Payments
        d.row("Cash",   "AED " + fmt(cash)); d.down();
        d.row("Card",   "AED " + fmt(card)); d.down();
        d.row("Credit", "AED " + fmt(credit)); d.down();
        d.row("Other",  "AED " + fmt(other)); d.down();
        d.hr();

        d.row("Counter", "1"); d.down();
      }

      doc.save(baos);
      return baos.toByteArray();

    } catch (IOException e) {
      throw new RuntimeException("Failed to generate X report PDF", e);
    }
  }

  // ---------- PDF drawing helper ----------
  static class Drawer {
    final PDPageContentStream cs;
    final float pageW;
    float y;
    final float lh = 12f;
    final float left = 8f;
    final float right;

    Drawer(PDPageContentStream cs, float pageW) {
      this.cs = cs;
      this.pageW = pageW;
      this.right = pageW - 8f;
    }

    void down() { y -= lh; }

    void center(String text, boolean bold) throws IOException {
      PDType1Font font = bold ? PDType1Font.COURIER_BOLD : PDType1Font.COURIER;
      float size = 10f;
      float tw = font.getStringWidth(text) / 1000f * size;

      cs.setFont(font, size);
      cs.beginText();
      cs.newLineAtOffset((pageW - tw) / 2f, y);
      cs.showText(text);
      cs.endText();
    }

    void row(String l, String r) throws IOException {
      float size = 10f;

      // left
      cs.setFont(PDType1Font.COURIER, size);
      cs.beginText();
      cs.newLineAtOffset(left, y);
      cs.showText(l);
      cs.endText();

      // right (right-aligned)
      float tw = PDType1Font.COURIER.getStringWidth(r) / 1000f * size;
      cs.beginText();
      cs.newLineAtOffset(right - tw, y);
      cs.showText(r);
      cs.endText();
    }

    void rowBold(String l, String r) throws IOException {
      float size = 10f;

      // left
      cs.setFont(PDType1Font.COURIER_BOLD, size);
      cs.beginText();
      cs.newLineAtOffset(left, y);
      cs.showText(l);
      cs.endText();

      // right
      float tw = PDType1Font.COURIER_BOLD.getStringWidth(r) / 1000f * size;
      cs.beginText();
      cs.newLineAtOffset(right - tw, y);
      cs.showText(r);
      cs.endText();

      // restore
      cs.setFont(PDType1Font.COURIER, size);
    }

    void hr() throws IOException {
      y -= 3;
      cs.moveTo(8, y);
      cs.lineTo(pageW - 8, y);
      cs.setLineDashPattern(new float[]{2, 2}, 0);
      cs.stroke();
      cs.setLineDashPattern(new float[]{}, 0);
      y -= 3;
    }
  }

  // ---------- ReportResponse extraction (no Java 16 features) ----------
  @SuppressWarnings("unchecked")
  private static List<Document> extractDocs(Object resp) {
    if (resp == null) return Collections.emptyList();
    String[] candidates = {
        "getData", "data",
        "getRecords", "records",
        "getContent", "content",
        "getItems", "items",
        "getResults", "results",
        "getList", "list"
    };
    for (String name : candidates) {
      try {
        Method m = resp.getClass().getMethod(name);
        Object v = m.invoke(resp);
        if (v instanceof List) {
          List<?> raw = (List<?>) v;
          if (raw.isEmpty()) return Collections.emptyList();
          // Convert to List<Document> if needed (avoid streams/toList for Java 8)
          List<Document> out = new ArrayList<>(raw.size());
          for (Object o : raw) {
            if (o instanceof Document) {
              out.add((Document) o);
            } else if (o instanceof java.util.Map) {
              @SuppressWarnings("unchecked")
              java.util.Map<String, Object> map = (java.util.Map<String, Object>) o;
              out.add(new Document(map));
            }
          }
          return out;
        }
      } catch (ReflectiveOperationException ignored) {}
    }
    return Collections.emptyList();
  }

  // ---------- BSON helpers ----------
  private static Document getDoc(Document d, String key) {
    Object v = d != null ? d.get(key) : null;
    return (v instanceof Document) ? (Document) v : new Document();
  }

  private static double getD(Document d, String key, double def) {
    Object v = d != null ? d.get(key) : null;
    if (v instanceof Number) return ((Number) v).doubleValue();
    try { return v != null ? Double.parseDouble(String.valueOf(v)) : def; }
    catch (Exception ignore) { return def; }
  }

  private static long getL(Document d, String key, long def) {
    Object v = d != null ? d.get(key) : null;
    if (v instanceof Number) return ((Number) v).longValue();
    try { return v != null ? Long.parseLong(String.valueOf(v)) : def; }
    catch (Exception ignore) { return def; }
  }

  private static String fmt(double n) {
    return String.format(Locale.US, "%,.2f", n);
  }
}
