package com.oficinazony.motomanager.security;

import com.oficinazony.motomanager.domain.enums.UserRole;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthContextService {

    public SecurityUser currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (SecurityUser) principal;
    }

    public boolean isSuperAdmin() {
        return currentUser().getRole() == UserRole.SUPERADMIN;
    }

    public Integer currentAdminGroupId() {
        return currentUser().getAdminGroupId();
    }
}
