// src/main/java/com/pos/controller/UploadController.java
package com.pos.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class UploadController {

  @Value("${app.upload-dir:uploads}")
  private String uploadDir;

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String,String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
    }

    // (Optional) simple allow-list
    String ct = file.getContentType();
    if (ct == null || !(ct.equals("image/png") || ct.equals("image/jpeg") || ct.equals("image/webp") || ct.equals("image/gif"))) {
      return ResponseEntity.badRequest().body(Map.of("message", "Only PNG/JPG/WEBP/GIF allowed"));
    }

    // ensure dir
    Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(dir);

    // unique filename
    String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "image" : file.getOriginalFilename());
    String ext = "";
    int dot = original.lastIndexOf('.');
    if (dot >= 0) ext = original.substring(dot);
    String filename = UUID.randomUUID().toString().replace("-", "") + ext.toLowerCase();

    // save
    Path target = dir.resolve(filename);
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

    // full URL (no /api prefix)
    String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                  .path("/uploads/")
                  .path(filename)
                  .toUriString();

    return ResponseEntity.ok(Map.of(
      "url", url,
      "filename", filename
    ));
  }
}
