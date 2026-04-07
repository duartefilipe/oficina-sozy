package com.oficinazony.motomanager.security;

import com.oficinazony.motomanager.domain.entity.AppUser;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.AppUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public AppUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado"));
        Integer adminGroupId = resolveAdminGroupId(user);
        return new SecurityUser(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getRole(),
                adminGroupId,
                Boolean.TRUE.equals(user.getAtivo())
        );
    }

    private Integer resolveAdminGroupId(AppUser user) {
        if (user.getRole() == UserRole.SUPERADMIN) {
            return null;
        }
        if (user.getRole() == UserRole.ADMIN) {
            return user.getId();
        }
        return user.getCreatedByAdmin() != null ? user.getCreatedByAdmin().getId() : null;
    }
}
