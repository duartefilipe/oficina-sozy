package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByUsername(String username);
    List<AppUser> findByCreatedByAdminId(Integer adminId);
    List<AppUser> findByOficinaId(Integer oficinaId);
}
