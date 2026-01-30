// com/pos/exception/GlobalExceptionHandler.java
package com.pos.exception;

import java.time.format.DateTimeParseException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.mongodb.MongoClientException;
import com.mongodb.MongoTimeoutException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @Value("${app.errors.verbose:true}")
  private boolean verbose;

  private ResponseEntity<ApiError> out(HttpStatus status, String msg, HttpServletRequest req) {
    return ResponseEntity.status(status)
        .body(new ApiError(status.value(), status.getReasonPhrase(), msg, req.getRequestURI()));
  }
  private String root(Exception ex) {
    if (!verbose) return Optional.ofNullable(ex.getMessage()).orElse(ex.getClass().getSimpleName());
    Throwable c = ex; while (c.getCause() != null) c = c.getCause();
    return Optional.ofNullable(c.getMessage()).orElse(ex.getClass().getSimpleName());
  }

  // 400s
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> badBody(MethodArgumentNotValidException ex, HttpServletRequest r) {
    String msg = ex.getBindingResult().getFieldErrors().stream().findFirst()
        .map(e -> e.getField() + ": " + e.getDefaultMessage()).orElse("Validation error");
    return out(HttpStatus.BAD_REQUEST, msg, r);
  }
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiError> badParams(ConstraintViolationException ex, HttpServletRequest r) {
    String msg = ex.getConstraintViolations().stream().findFirst()
        .map(v -> v.getPropertyPath() + ": " + v.getMessage()).orElse("Constraint violation");
    return out(HttpStatus.BAD_REQUEST, msg, r);
  }
  @ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, DateTimeParseException.class })
  public ResponseEntity<ApiError> badType(Exception ex, HttpServletRequest r) {
    return out(HttpStatus.BAD_REQUEST, "Bad request: " + root((Exception) ex), r);
  }
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> illegal(IllegalArgumentException ex, HttpServletRequest r) {
    String msg = root(ex);
    HttpStatus st = msg.toLowerCase().contains("not found") ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    return out(st, msg, r);
  }

  // 404 / 405
  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ApiError> notFound(NoHandlerFoundException ex, HttpServletRequest r) {
    return out(HttpStatus.NOT_FOUND, "Endpoint not found", r);
  }
  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiError> methodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest r) {
    return out(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed", r);
  }

  // 409
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> integrity(DataIntegrityViolationException ex, HttpServletRequest r) {
    String root = Optional.ofNullable(ex.getMostSpecificCause()).map(Throwable::getMessage)
        .orElse("Data integrity violation");
    return out(HttpStatus.CONFLICT, root, r);
  }
  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<ApiError> duplicate(DuplicateKeyException ex, HttpServletRequest r) {
    String s = String.valueOf(ex.getMessage()).toLowerCase();
    String msg = s.contains("subitems.barcode") ? "❌ A subitem barcode already exists."
      : s.contains("productcode") ? "❌ Pole scale product code already exists."
      : s.contains("barcode") ? "❌ Barcode already exists."
      : s.contains("code") ? "❌ Product code already exists."
      : "❌ Duplicate key found.";
    return out(HttpStatus.CONFLICT, msg, r);
  }

  // Mongo / data access
  @ExceptionHandler({ MongoTimeoutException.class, MongoClientException.class, DataAccessResourceFailureException.class })
  public ResponseEntity<ApiError> dbDown(Exception ex, HttpServletRequest r) {
    log.error("Database connectivity error", ex);
    return out(HttpStatus.SERVICE_UNAVAILABLE, "Database unavailable: " + root(ex), r);
  }

  // 500 fallback
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> fallback(Exception ex, HttpServletRequest r) {
    log.error("Unhandled error on {} {}", r.getMethod(), r.getRequestURI(), ex);
    return out(HttpStatus.INTERNAL_SERVER_ERROR, verbose ? root(ex) : "Server error", r);
  }
}
