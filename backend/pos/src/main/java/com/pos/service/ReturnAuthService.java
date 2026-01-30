package com.pos.service;

import com.pos.dto.managerauth.CreateManagerRequest;
import com.pos.dto.managerauth.ManagerAuthResponse;
import com.pos.dto.managerauth.ManagerSummary;
import com.pos.dto.managerauth.UpdateAuthRequest;
import com.pos.dto.managerauth.VerifyAuthRequest;
import com.pos.dto.managerauth.VerifyAuthResponse;
import com.pos.model.User;
import com.pos.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReturnAuthService {

  private static final String ROLE_MANAGER = "MANAGER";
  private static final String ROLE_ADMIN   = "ADMIN";
  private static final List<String> MANAGER_ROLES = Arrays.asList(ROLE_MANAGER, ROLE_ADMIN);

  private final UserRepository userRepo;
  private final PasswordEncoder encoder;

  public ReturnAuthService(UserRepository userRepo, PasswordEncoder encoder) {
    this.userRepo = userRepo;
    this.encoder = encoder;
  }

  /* ---------- Manager list / read / update / create ---------- */

  public List<ManagerSummary> listManagers() {
    return userRepo.findByRoleIn(MANAGER_ROLES).stream()
        .map(u -> new ManagerSummary(
            u.getId(),
            displayName(u),
            u.getUsername(),
            u.getRole(),
            u.isEnabled()))
        .collect(Collectors.toList());
  }

  public ManagerAuthResponse getAuth(String userId) {
    User u = userRepo.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return new ManagerAuthResponse(hasText(u.getReturnPinHash()), u.getReturnCardUid());
  }

  public void updateAuth(String userId, UpdateAuthRequest req) {
    User u = userRepo.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // PIN: optional, must be 4–8 digits when provided
    if (hasText(req.getPin())) {
      if (!req.getPin().matches("\\d{4,8}")) {
        throw new IllegalArgumentException("PIN must be 4–8 digits");
      }
      u.setReturnPinHash(encoder.encode(req.getPin()));
    }

    // Card UID: nullable; blank clears it
    if (req.getCardUid() != null) {
      u.setReturnCardUid(req.getCardUid().trim().isEmpty() ? null : req.getCardUid().trim());
    }

    userRepo.save(u);
  }

  public ManagerSummary createManager(CreateManagerRequest req) {
    if (!hasText(req.getFullName())) {
      throw new IllegalArgumentException("Full name is required");
    }
    if (hasText(req.getPin()) && !req.getPin().matches("\\d{4,8}")) {
      throw new IllegalArgumentException("PIN must be 4–8 digits");
    }

    // Username generation
    String base = hasText(req.getUsername()) ? req.getUsername().trim() : slug(req.getFullName());
    if (base.isEmpty()) base = "manager";
    String username = uniqueUsername(base);

    // Password generation (optional in request)
    String rawPassword = (hasText(req.getPassword()) && req.getPassword().length() >= 4)
        ? req.getPassword()
        : generatePassword(12);

    User u = new User();
    u.setUsername(username);
    u.setPassword(encoder.encode(rawPassword));
    u.setFullName(req.getFullName().trim());
    u.setRole(ROLE_MANAGER);
    u.setEnabled(req.isEnabled());

    if (hasText(req.getPin()))     u.setReturnPinHash(encoder.encode(req.getPin()));
    if (hasText(req.getCardUid())) u.setReturnCardUid(req.getCardUid().trim());

    userRepo.save(u);
    return new ManagerSummary(u.getId(), u.getFullName(), u.getUsername(), u.getRole(), u.isEnabled());
  }

  /* ---------- Verify (card first, then PIN) ---------- */

  public VerifyAuthResponse verify(VerifyAuthRequest req) {
    boolean hasPin  = hasText(req.getPin());
    boolean hasCard = hasText(req.getCardUid());

    if (!hasPin && !hasCard) {
      return new VerifyAuthResponse(false, "PIN or Card is required.", null);
    }

    // 1) Match Card UID (fast path)
    if (hasCard) {
      Optional<User> byCard = userRepo.findByReturnCardUid(req.getCardUid().trim());
      if (byCard.isPresent()) {
        User u = byCard.get();
        if (u.isEnabled() && isManagerOrAdmin(u.getRole())) {
          return ok(u);
        }
      }
    }

    // 2) Match PIN among managers/admins
    if (hasPin) {
      for (User u : userRepo.findByRoleIn(MANAGER_ROLES)) {
        if (u.isEnabled()
            && hasText(u.getReturnPinHash())
            && encoder.matches(req.getPin(), u.getReturnPinHash())) {
          return ok(u);
        }
      }
    }

    return new VerifyAuthResponse(false, "Invalid PIN/Card or user disabled.", null);
  }

  private VerifyAuthResponse ok(User u) {
    return new VerifyAuthResponse(
        true,
        null,
        new VerifyAuthResponse.SimpleUser(u.getId(), displayName(u), u.getUsername()));
  }

  private static boolean isManagerOrAdmin(String role) {
    return ROLE_MANAGER.equalsIgnoreCase(role) || ROLE_ADMIN.equalsIgnoreCase(role);
  }

  private static String displayName(User u) {
    return hasText(u.getFullName()) ? u.getFullName() : u.getUsername();
  }

  /* ---------- helpers ---------- */

  private String uniqueUsername(String base) {
    String root = base.toLowerCase();
    String candidate = root;
    int i = 1;
    while (userRepo.existsByUsernameIgnoreCase(candidate)) {
      candidate = root + i++;
    }
    return candidate;
  }

  private static String slug(String s) {
    String n = Normalizer.normalize(s, Normalizer.Form.NFD)
        .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    return n.toLowerCase()
        .replaceAll("[^a-z0-9]+", "_")
        .replaceAll("(^_+)|(_+$)", "");
  }

  private static boolean hasText(String s) {
    return s != null && !s.trim().isEmpty();
  }

  private static String generatePassword(int len) {
    final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    SecureRandom r = new SecureRandom();
    StringBuilder sb = new StringBuilder(len);
    for (int i = 0; i < len; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
    return sb.toString();
  }
}
