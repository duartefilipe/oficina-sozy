package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByUsername(String username);
    List<AppUser> findByCreatedByAdminId(Integer adminId);
    List<AppUser> findByOficinaId(Integer oficinaId);

    @Modifying
    @Query("""
            update AppUser u
            set u.createdByAdmin = null
            where u.createdByAdmin.id in (
                select admin.id
                from AppUser admin
                where admin.oficina.id = :oficinaId
            )
            """)
    void desvincularCriadorPorOficina(@Param("oficinaId") Integer oficinaId);

    void deleteByOficinaId(Integer oficinaId);
}
