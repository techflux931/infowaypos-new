// src/main/java/com/pos/dto/dashboard/TopProductDTO.java
package com.pos.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopProductDTO {
  private String name;
  private double value; // revenue = qty * price
}
