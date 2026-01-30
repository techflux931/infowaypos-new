package com.pos.dto;
import lombok.Data;

@Data
public class ReturnAuthRequest {
  private String pin;      // optional
  private String cardUid;  // optional
}
