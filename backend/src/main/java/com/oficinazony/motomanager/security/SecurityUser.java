package com.oficinazony.motomanager.security;

import com.oficinazony.motomanager.domain.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public class SecurityUser implements UserDetails {
    private final Integer id;
    private final String username;
    private final String passwordHash;
    private final UserRole role;
    private final Integer adminGroupId;
    private final boolean ativo;

    public SecurityUser(Integer id, String username, String passwordHash, UserRole role, Integer adminGroupId, boolean ativo) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.adminGroupId = adminGroupId;
        this.ativo = ativo;
    }

    public Integer getId() {
        return id;
    }

    public UserRole getRole() {
        return role;
    }

    public Integer getAdminGroupId() {
        return adminGroupId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return ativo;
    }

    @Override
    public boolean isAccountNonLocked() {
        return ativo;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return ativo;
    }

    @Override
    public boolean isEnabled() {
        return ativo;
    }
}
