package com.pos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "bridge")
@Getter @Setter
public class BridgeProperties {
    private String url = "http://localhost:8081";
}
