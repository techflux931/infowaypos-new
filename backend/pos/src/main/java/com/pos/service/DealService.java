// src/main/java/com/pos/service/DealService.java
package com.pos.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.pos.config.TwilioProperties;
import com.pos.model.Deal;
import com.pos.model.WhatsAppRequest;
import com.pos.repository.DealRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;

/** DealService using Apache PDFBox (no iText). */
@Service
public class DealService {
  private static final Logger log = LoggerFactory.getLogger(DealService.class);

  private final DealRepository dealRepository;
  private final TwilioProperties twilio;

  // Where your FileController saves files
  private final Path uploadsRoot = Paths.get("uploads").toAbsolutePath();
  // Prefix of the public URL you store in Mongo (adjust if you serve from another host)
  private static final String PUBLIC_UPLOAD_PREFIX = "/uploads/";

  public DealService(DealRepository dealRepository, TwilioProperties twilio) {
    this.dealRepository = dealRepository;
    this.twilio = twilio;
  }

  @PostConstruct
  void initTwilio() {
    if (twilio.getAccountSid() != null && twilio.getAuthToken() != null) {
      Twilio.init(twilio.getAccountSid(), twilio.getAuthToken());
      log.info("Twilio initialized. From={}", twilio.getFromNumber());
    } else {
      log.warn("Twilio not configured; WhatsApp sending will be disabled.");
    }
  }

  public Deal saveDeal(Deal deal) { return dealRepository.save(deal); }
  public List<Deal> getAllDeals() { return dealRepository.findAll(); }
  public Optional<Deal> findById(String id) { return dealRepository.findById(id); }
  public void deleteById(String id) { dealRepository.deleteById(id); }

  /* ===================== PDF (PDFBox) ===================== */

  /** All deals in one PDF (thumbnail sized images). */
  public byte[] generatePdfBrochure(List<Deal> deals) {
    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PdfCtx ctx = new PdfCtx(doc, PDRectangle.A4);

      ctx.title("Deal of the Day");

      ctx.setFont(PDType1Font.HELVETICA, 12);
      for (Deal d : deals) {
        ctx.ensureSpace(70f);
        ctx.text(oneLine(d));
        ctx.down(4f);

        ctx.addImageIfAny(d.getImageUrl(), 220f, 160f);

        ctx.down(8f);
        ctx.hr();
        ctx.down(10f);
      }

      ctx.close(); // close last content stream
      doc.save(baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException("Failed to generate brochure PDF", e);
    }
  }

  /** Single deal PDF with larger image. */
  public byte[] generatePdfForDeal(Deal d) {
    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PdfCtx ctx = new PdfCtx(doc, PDRectangle.A4);

      ctx.title(nz(d.getTitle(), "Deal"));

      ctx.setFont(PDType1Font.HELVETICA, 12);
      ctx.text("Date: " + nz(d.getDate(), "-"));
      ctx.down(8f);

      ctx.setFont(PDType1Font.HELVETICA_BOLD, 12);
      ctx.text("Description");
      ctx.setFont(PDType1Font.HELVETICA, 12);
      ctx.text(nz(d.getDescription(), "-"));
      ctx.down(4f);

      ctx.addImageIfAny(d.getImageUrl(), 360f, 260f);

      ctx.close();
      doc.save(baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException("Failed to generate deal PDF", e);
    }
  }

  /* ===================== WhatsApp (Twilio) ===================== */

  public void sendWhatsAppMessage(WhatsAppRequest request) {
    if (twilio.getAccountSid() == null) {
      log.warn("Twilio not configured; skipping WhatsApp send.");
      return;
    }
    String from = "whatsapp:" + twilio.getFromNumber();
    for (String to : request.getToNumbers()) {
      Message.creator(new PhoneNumber("whatsapp:" + to),
                      new PhoneNumber(from),
                      request.getMessage())
             .create();
    }
  }

  /* ===================== Helpers ===================== */

  private static String nz(String v, String def) { return (v == null || v.isBlank()) ? def : v; }

  private String oneLine(Deal d) {
    return "- " + nz(d.getTitle(), "Deal") + " | " + nz(d.getDescription(), "-");
  }

  /** Load image from /uploads/... mapped to disk, or from URL. */
  private PDImageXObject loadDealImage(PDDocument doc, String imageUrl) {
    if (imageUrl == null || imageUrl.isBlank()) return null;

    // 1) Try local /uploads mapping
    try {
      int idx = imageUrl.indexOf(PUBLIC_UPLOAD_PREFIX);
      if (idx >= 0) {
        String fileName = imageUrl.substring(idx + PUBLIC_UPLOAD_PREFIX.length());
        Path p = uploadsRoot.resolve(fileName).normalize();
        if (Files.exists(p)) {
          String lower = fileName.toLowerCase(Locale.ROOT);
          if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            try (InputStream in = Files.newInputStream(p)) {
              return JPEGFactory.createFromStream(doc, in);
            }
          } else {
            return LosslessFactory.createFromImage(doc, javax.imageio.ImageIO.read(p.toFile()));
          }
        }
      }
    } catch (Exception e) {
      log.debug("Local image load attempt failed: {}", e.toString());
    }

    // 2) Fallback: remote URL
    try (InputStream in = URI.create(imageUrl).toURL().openStream()) {
      byte[] data = in.readAllBytes();
      try {
        return JPEGFactory.createFromStream(doc, new java.io.ByteArrayInputStream(data));
      } catch (Exception ignore) {
        return LosslessFactory.createFromImage(
            doc, javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(data)));
      }
    } catch (Exception e) {
      log.warn("Could not load image for PDF from {}: {}", imageUrl, e.toString());
      return null;
    }
  }

  /* ---------------- PDF context wrapper ---------------- */

  /** Small helper that owns the current page/content stream and y-position. */
  private final class PdfCtx implements AutoCloseable {
    private final PDDocument doc;
    private PDPage page;
    private PDPageContentStream cs;
    private final float margin = 36f;
    private float y;

    PdfCtx(PDDocument doc, PDRectangle size) throws IOException {
      this.doc = doc;
      this.page = new PDPage(size);
      this.doc.addPage(this.page);
      this.cs = new PDPageContentStream(doc, page);
      this.y = page.getMediaBox().getHeight() - margin;
    }

    void setFont(PDType1Font font, float size) throws IOException {
      cs.setFont(font, size);
    }

    void title(String text) throws IOException {
      float pageW = page.getMediaBox().getWidth();
      float size = 18f;
      cs.setFont(PDType1Font.HELVETICA_BOLD, size);
      float tw = PDType1Font.HELVETICA_BOLD.getStringWidth(text) / 1000f * size;
      cs.beginText();
      cs.newLineAtOffset((pageW - tw) / 2f, y);
      cs.showText(text);
      cs.endText();
      y -= 26f;
    }

    void text(String t) throws IOException {
      cs.beginText();
      cs.newLineAtOffset(margin, y);
      cs.showText(t);
      cs.endText();
      y -= 16f;
    }

    void hr() throws IOException {
      float pageW = page.getMediaBox().getWidth();
      cs.moveTo(margin, y);
      cs.lineTo(pageW - margin, y);
      cs.stroke();
    }

    void down(float dy) { y -= dy; }

    /** Ensure there’s room; if not, start a new page (closing/reopening the stream). */
    void ensureSpace(float needed) throws IOException {
      if (y - needed > margin) return;
      cs.close();
      page = new PDPage(page.getMediaBox());
      doc.addPage(page);
      cs = new PDPageContentStream(doc, page);
      y = page.getMediaBox().getHeight() - margin;
    }

    void addImageIfAny(String imageUrl, float maxW, float maxH) throws IOException {
      PDImageXObject img = loadDealImage(doc, imageUrl);
      if (img == null) return;

      float iw = img.getWidth();
      float ih = img.getHeight();
      float scale = Math.min(maxW / iw, maxH / ih);
      float w = iw * scale;
      float h = ih * scale;

      ensureSpace(h + 20f);

      cs.drawImage(img, margin, y - h, w, h);
      y -= (h + 10f);
    }

    @Override public void close() throws IOException {
      if (cs != null) cs.close();
    }
  }
}
