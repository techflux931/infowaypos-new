package com.pos.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import com.pos.model.Quote;
import com.pos.model.QuoteItem;

@Service
public class QuotePdfService {

  /** Generate a single-quote PDF in memory (no temp files, no iText). */
  public byte[] generateQuotePdfBytes(Quote quote) {
    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PDPage page = new PDPage(PDRectangle.A4);
      doc.addPage(page);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        final float margin = 36f;
        final float pageW  = page.getMediaBox().getWidth();
        float y = page.getMediaBox().getHeight() - margin;

        // Title
        cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
        String title = "QUOTE";
        float tw = PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000f * 18f;
        cs.beginText();
        cs.newLineAtOffset((pageW - tw) / 2f, y);
        cs.showText(title);
        cs.endText();
        y -= 24f;

        // Header block (labels on left, values right-aligned)
        cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
        y = labelValue(cs, margin, pageW - margin, y, "Quote No:", nz(quote.getQuoteNumber()));
        y = labelValue(cs, margin, pageW - margin, y, "Quote Date:", nzDate(quote.getQuoteDate()));
        y = labelValue(cs, margin, pageW - margin, y, "Valid Till:", nzDate(quote.getValidTill()));
        y = labelValue(cs, margin, pageW - margin, y, "Customer:", nz(quote.getCustomerName()));
        y = labelValue(cs, margin, pageW - margin, y, "TRN:", nz(quote.getTrn()));
        y = labelValue(cs, margin, pageW - margin, y, "Subject:", nz(quote.getSubject()));

        y -= 6f;
        hr(cs, margin, pageW - margin, y);
        y -= 12f;

        // Notes (optional)
        if (!isBlank(quote.getNotes())) {
          cs.setFont(PDType1Font.HELVETICA, 11);
          y = paragraph(cs, margin, y, pageW - margin, "Notes: " + nz(quote.getNotes()));
          y -= 6f;
        }

        // Items table (simple 5 columns)
        float[] colX = {
          margin,             // Code
          margin + 80,        // Description
          margin + 350,       // Qty
          margin + 420,       // Price
          pageW - margin      // Tax (right edge)
        };

        // Table header
        cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
        y = ensureSpace(doc, page, cs, y, 20f);
        y = tableHeader(cs, y, colX, "Code", "Description", "Qty", "Price", "Tax");

        // Table rows
        cs.setFont(PDType1Font.HELVETICA, 11);
        List<QuoteItem> items = quote.getItems();
        if (items != null) {
          for (QuoteItem it : items) {
            y = ensureSpace(doc, page, cs, y, 16f);
            y = tableRow(cs, y, colX,
                nz(it.getItemCode()),
                nz(it.getDescription()),
                fmt(it.getQty()),
                fmt(it.getPrice()),
                fmt(it.getTax()));
          }
        }

        y -= 6f;
        hr(cs, margin, pageW - margin, y);
        y -= 12f;

        // Terms & totals row
        float leftWidth  = (pageW - 2 * margin) * 0.55f;
        float rightStart = margin + leftWidth + 12f;

        // Left: payment/delivery terms (multi-line)
        cs.setFont(PDType1Font.HELVETICA, 11);
        if (!isBlank(quote.getPaymentTerms())) {
          y = paragraph(cs, margin, y, margin + leftWidth, "Payment Terms: " + nz(quote.getPaymentTerms()));
          y -= 2f;
        }
        if (!isBlank(quote.getDeliveryTerms())) {
          y = paragraph(cs, margin, y, margin + leftWidth, "Delivery Terms: " + nz(quote.getDeliveryTerms()));
        }

        // Right: total aligned to right edge
        String totalLine = "Total Amount: AED " + fmt(quote.getTotalAmount());
        cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
        float tWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(totalLine) / 1000f * 12f;
        cs.beginText();
        cs.newLineAtOffset((pageW - margin) - tWidth, y);
        cs.showText(totalLine);
        cs.endText();
      }

      doc.save(baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException("Failed to generate Quote PDF", e);
    }
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────

  private static float labelValue(PDPageContentStream cs, float left, float right, float y, String label, String value) throws IOException {
    float size = 11f;
    // label
    cs.setFont(PDType1Font.HELVETICA_BOLD, size);
    cs.beginText(); cs.newLineAtOffset(left, y); cs.showText(label); cs.endText();

    // value right-aligned
    cs.setFont(PDType1Font.HELVETICA, size);
    float w = PDType1Font.HELVETICA.getStringWidth(value) / 1000f * size;
    cs.beginText(); cs.newLineAtOffset(right - w, y); cs.showText(value); cs.endText();
    return y - 16f;
  }

  private static float paragraph(PDPageContentStream cs, float left, float y, float right, String text) throws IOException {
    // very simple single-line; for long text you might split by width
    cs.beginText();
    cs.newLineAtOffset(left, y);
    cs.showText(text);
    cs.endText();
    return y - 14f;
  }

  private static float tableHeader(PDPageContentStream cs, float y, float[] x, String c1, String c2, String c3, String c4, String c5) throws IOException {
    cs.beginText(); cs.newLineAtOffset(x[0], y); cs.showText(c1); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[1], y); cs.showText(c2); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[2], y); cs.showText(c3); cs.endText();

    float s = 11f;
    float w4 = PDType1Font.HELVETICA_BOLD.getStringWidth(c4) / 1000f * s;
    cs.beginText(); cs.newLineAtOffset(x[3] + 70 - w4, y); cs.showText(c4); cs.endText();

    float w5 = PDType1Font.HELVETICA_BOLD.getStringWidth(c5) / 1000f * s;
    cs.beginText(); cs.newLineAtOffset(x[4] - w5, y); cs.showText(c5); cs.endText();

    return y - 16f;
  }

  private static float tableRow(PDPageContentStream cs, float y, float[] x, String c1, String c2, String c3, String c4, String c5) throws IOException {
    cs.beginText(); cs.newLineAtOffset(x[0], y); cs.showText(c1); cs.endText();
    cs.beginText(); cs.newLineAtOffset(x[1], y); cs.showText(c2); cs.endText();

    float s = 11f;
    float w3 = PDType1Font.HELVETICA.getStringWidth(c3) / 1000f * s;
    cs.beginText(); cs.newLineAtOffset(x[2] + 30 - w3, y); cs.showText(c3); cs.endText();

    float w4 = PDType1Font.HELVETICA.getStringWidth(c4) / 1000f * s;
    cs.beginText(); cs.newLineAtOffset(x[3] + 70 - w4, y); cs.showText(c4); cs.endText();

    float w5 = PDType1Font.HELVETICA.getStringWidth(c5) / 1000f * s;
    cs.beginText(); cs.newLineAtOffset(x[4] - w5, y); cs.showText(c5); cs.endText();

    return y - 14f;
  }

  private static void hr(PDPageContentStream cs, float x1, float x2, float y) throws IOException {
    cs.moveTo(x1, y);
    cs.lineTo(x2, y);
    cs.stroke();
  }

  private static float ensureSpace(PDDocument doc, PDPage page, PDPageContentStream cs, float y, float needed) throws IOException {
    if (y - needed > 36f) return y;
    // simple new page if needed
    cs.close();
    PDPage newPage = new PDPage(PDRectangle.A4);
    doc.addPage(newPage);
    return newPage.getMediaBox().getHeight() - 36f;
  }

  // ── small utils ────────────────────────────────────────────────────────────
  private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
  private static String nz(String s) { return s == null ? "" : s; }
  private static String nzDate(Object date) {
    if (date == null) return "";
    if (date instanceof java.time.LocalDate d) return d.format(DateTimeFormatter.ISO_DATE);
    if (date instanceof java.time.LocalDateTime dt) return dt.toLocalDate().format(DateTimeFormatter.ISO_DATE);
    if (date instanceof java.util.Date d) {
      return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate().format(DateTimeFormatter.ISO_DATE);
    }
    return String.valueOf(date);
  }
  private static String fmt(double v) { return String.format(Locale.US, "%,.2f", v); }
}
