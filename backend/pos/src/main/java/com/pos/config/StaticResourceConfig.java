// src/main/java/com/pos/config/StaticResourceConfig.java
package com.pos.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads/product-images").toAbsolutePath().normalize();

        registry.addResourceHandler("/files/product-images/**")
                // Use URI so Spring gets file:/C:/... style instead of backslashes
                .addResourceLocations(uploadDir.toUri().toString())
                .setCachePeriod(3600);
    }
}
