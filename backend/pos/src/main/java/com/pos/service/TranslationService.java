package com.pos.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class TranslationService {
    private static final Map<String, String> DICTIONARY = new HashMap<>();
    private static final Map<String, String> MEASUREMENTS = new HashMap<>();

    static {
        // Common grocery items
        DICTIONARY.put("milk", "حليب");
        DICTIONARY.put("cheese", "جبنة");
        DICTIONARY.put("rice", "أرز");
        // Add 200+ common items
        
        // Measurement units
        MEASUREMENTS.put("ml", "مل");
        MEASUREMENTS.put("l", "لتر");
        MEASUREMENTS.put("g", "جرام");
        MEASUREMENTS.put("kg", "كيلو");
        MEASUREMENTS.put("can", "علبة");
        MEASUREMENTS.put("bottle", "زجاجة");
    }

    public String autoTranslate(String englishText) {
        if (englishText == null || englishText.isEmpty()) return "";
        
        String lowerText = englishText.toLowerCase();
        
        // 1. Check exact matches
        if (DICTIONARY.containsKey(lowerText)) {
            return DICTIONARY.get(lowerText);
        }
        
        // 2. Apply measurement conversions
        String arabic = englishText;
        for (Map.Entry<String, String> entry : MEASUREMENTS.entrySet()) {
            arabic = arabic.replaceAll("(?i)" + entry.getKey(), entry.getValue());
        }
        
        // 3. Replace numbers with Arabic numerals
        arabic = arabic.replace("0", "٠")
                      .replace("1", "١")
                      .replace("2", "٢")
                      .replace("3", "٣")
                      .replace("4", "٤")
                      .replace("5", "٥")
                      .replace("6", "٦")
                      .replace("7", "٧")
                      .replace("8", "٨")
                      .replace("9", "٩");
        
        return arabic;
    }
}