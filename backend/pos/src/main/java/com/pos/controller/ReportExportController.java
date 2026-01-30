// src/main/java/com/pos/controller/ReportExportController.java
package com.pos.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportExportController {

  @GetMapping(value = "/shift/export", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> exportShift(@RequestParam String type) {
    byte[] pdf = buildShiftPdf(type);

    String filename = "Shift-" + type + "-" +
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm")) + ".pdf";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  private byte[] buildShiftPdf(String type) {
    try (PDDocument doc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      PDPage page = new PDPage(PDRectangle.A4);
      doc.addPage(page);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        float margin = 36f;
        float pageW = page.getMediaBox().getWidth();
        float y = page.getMediaBox().getHeight() - margin;

        // Title
        String title = "Shift " + type + " Report";
        float titleSize = 18f;
        cs.setFont(PDType1Font.HELVETICA_BOLD, titleSize);
        float tw = PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000f * titleSize;
        cs.beginText();
        cs.newLineAtOffset((pageW - tw) / 2f, y);
        cs.showText(title);
        cs.endText();
        y -= 30f;

        // Generated at
        String gen = "Generated at: " +
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        cs.setFont(PDType1Font.HELVETICA, 12f);
        cs.beginText();
        cs.newLineAtOffset(margin, y);
        cs.showText(gen);
        cs.endText();
      }

      doc.save(baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException("Failed to generate shift report PDF", e);
    }
  }
}
