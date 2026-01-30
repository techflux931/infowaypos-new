package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "account_group_refs")
public class AccountGroupRef {
  @Id
  private String id;
  private String code;      // e.g., "ASSET", "LIABILITY"
  private String name;      // display name
  private String parentId;  // parent group ref id if any
}
