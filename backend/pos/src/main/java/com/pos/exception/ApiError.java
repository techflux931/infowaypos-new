// com/pos/exception/ApiError.java
package com.pos.exception;

import java.time.Instant;

public class ApiError {
  private Instant timestamp = Instant.now();
  private int status;
  private String error;
  private String message;
  private String path;

  public ApiError() {}
  public ApiError(int status, String error, String message, String path) {
    this.status = status; this.error = error; this.message = message; this.path = path;
  }

  public Instant getTimestamp() { return timestamp; }
  public int getStatus() { return status; }
  public String getError() { return error; }
  public String getMessage() { return message; }
  public String getPath() { return path; }

  public void setTimestamp(Instant t) { this.timestamp = t; }
  public void setStatus(int s) { this.status = s; }
  public void setError(String e) { this.error = e; }
  public void setMessage(String m) { this.message = m; }
  public void setPath(String p) { this.path = p; }
}
