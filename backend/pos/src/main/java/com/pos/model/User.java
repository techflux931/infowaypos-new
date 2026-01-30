// src/main/java/com/pos/model/User.java
package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {
  @Id
  private String id;

  private String username;
  private String email;          // <- fixed typo
  private String password;
  private String role;           // e.g., "ADMIN", "CASHIER", "MANAGER"
  private boolean enabled = true;

  // --- Manager Auth fields used by ReturnAuthService ---
  private String fullName;       // display name
  private String returnPinHash;  // encoded PIN
  private String returnCardUid;  // optional card UID

  public User() {}

  public User(String id, String username, String email, String password, String role, boolean enabled) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role;
    this.enabled = enabled;
  }

  // Seeder convenience ctor
  public User(String username, String email, String password, String role) {
    this(null, username, email, password, role, true);
  }

  // --- getters/setters ---
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }

  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }

  public String getFullName() { return fullName; }
  public void setFullName(String fullName) { this.fullName = fullName; }

  public String getReturnPinHash() { return returnPinHash; }
  public void setReturnPinHash(String returnPinHash) { this.returnPinHash = returnPinHash; }

  public String getReturnCardUid() { return returnCardUid; }
  public void setReturnCardUid(String returnCardUid) { this.returnCardUid = returnCardUid; }
}
