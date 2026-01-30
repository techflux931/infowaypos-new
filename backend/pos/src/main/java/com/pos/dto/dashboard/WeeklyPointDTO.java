// src/main/java/com/pos/dto/dashboard/WeeklyPointDTO.java
package com.pos.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WeeklyPointDTO {
  private String date;   // YYYY-MM-DD
  private double sales;
  private double purchase;
}
