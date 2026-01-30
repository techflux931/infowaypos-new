package com.pos.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "account_groups")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountGroup {
  @Id
  private String id;

  @Indexed(unique = true)
  private String name;

  /** Parent group id (nullable) */
  private String underAccountId;

  private AccountNature nature;   // enum above
  private boolean affectGrossProfit;
  private String remarks;
}
