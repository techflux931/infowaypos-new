package com.pos.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "items")
public class Item {
  @Id
  private String id;

  private String barcode;
  private String code;          // product code
  private String name;
  private String categoryId;    // references Category.id
  private Double price;
}
