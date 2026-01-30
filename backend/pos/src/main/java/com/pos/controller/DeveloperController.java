package com.pos.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DeveloperController {

    private static final String BACKUP_FOLDER = "backups";
    private static final String BACKUP_FILE_NAME = "pos-backup.json";

    // Endpoint to download backup
    @GetMapping("/backup")
    public ResponseEntity<?> downloadBackup() {
        try {
            Path backupPath = Paths.get(BACKUP_FOLDER, BACKUP_FILE_NAME);
            if (Files.notExists(backupPath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Backup file not found.");
            }

            byte[] fileBytes = Files.readAllBytes(backupPath);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=" + BACKUP_FILE_NAME)
                    .body(fileBytes);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read backup file.");
        }
    }

    // Endpoint to restore backup
    @PostMapping("/restore")
    public ResponseEntity<?> uploadBackup(@RequestParam("file") MultipartFile file) {
        try {
            Path backupDir = Paths.get(BACKUP_FOLDER);
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
            }

            Path backupFile = backupDir.resolve(BACKUP_FILE_NAME);
            Files.write(backupFile, file.getBytes());

            return ResponseEntity.ok("Restore completed successfully.");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to restore backup.");
        }
    }

    // Optional: Record last login (can be saved in DB or file)
    @GetMapping("/last-login")
    public ResponseEntity<String> getLastLogin() {
        return ResponseEntity.ok(LocalDateTime.now().toString());
    }
}
