package com.pos.config;

import java.time.Duration;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class WebConfig {

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();

    // ✅ Add your real frontend URLs here
    cors.setAllowedOriginPatterns(List.of(
        "http://localhost:3000",
        "http://localhost:5173",
        "https://infowayspos.netlify.app",
        "https://*.netlify.app"
    ));

    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("*"));
    cors.setExposedHeaders(List.of("Location", "Content-Disposition"));
    cors.setAllowCredentials(false); // ✅ keep false because axios withCredentials=false
    cors.setMaxAge(Duration.ofHours(1));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }
}
