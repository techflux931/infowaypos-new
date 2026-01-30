package com.pos.repository;

import com.pos.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    List<User> findByRoleIn(Collection<String> roles);

    // Needed by ReturnAuthService.verify(cardUid)
    // Ensure your User entity has the field: private String returnCardUid;
    Optional<User> findByReturnCardUid(String returnCardUid);
}
