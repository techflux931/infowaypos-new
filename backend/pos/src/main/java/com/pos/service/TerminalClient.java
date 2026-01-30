package com.pos.service;

import org.springframework.stereotype.Service;

import com.pos.config.TerminalProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TerminalClient {
  private final TerminalProperties props;
  public String endpoint() { return props.getBaseUrl(); }
}
