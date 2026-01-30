// src/main/java/com/pos/model/Deal.java
package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Marketing deal / offer shown in the UI and optionally sent to customers.
 * - date is kept as ISO string ("yyyy-MM-dd") to match the UI
 * - createdAt (epoch millis) is used for reliable "newest first" sorts
 */
@Document(collection = "deals")
public class Deal {

  @Id
  private String id;

  private String title;
  private String description;

  /** Optional image URL (e.g., after uploading to S3/Cloudinary/local static path). */
  private String imageUrl;

  /** Keep as String to match UI ("yyyy-MM-dd"). Indexed for simple filtering/sorting. */
  @Indexed
  private String date;

  /** Epoch millis; set when constructed if not provided. */
  @Indexed
  private Long createdAt;

  public Deal() {
    this.createdAt = System.currentTimeMillis();
  }

  public Deal(String title, String description, String imageUrl, String date) {
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.date = date;
    this.createdAt = System.currentTimeMillis();
  }

  // ----- getters / setters -----

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public String getImageUrl() { return imageUrl; }
  public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

  public String getDate() { return date; }
  public void setDate(String date) { this.date = date; }

  public Long getCreatedAt() { return createdAt; }
  public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
