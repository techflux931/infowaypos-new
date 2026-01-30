package com.pos.config;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class WebConfig {

  /** Frontend origin, e.g. http://localhost:3000 or https://pos.example.com */
  @Value("${frontend.origin:http://localhost:3000}")
  private String frontendOrigin;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();

    // Using patterns lets Spring echo the request Origin (good with credentials)
    cors.setAllowedOriginPatterns(List.of(frontendOrigin));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("*"));
    cors.setExposedHeaders(List.of("Location", "Content-Disposition")); // file downloads, 201 Location
    cors.setAllowCredentials(true); // safe because we're not using "*"
    cors.setMaxAge(Duration.ofHours(1)); // cache preflight for 1h

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }
}
