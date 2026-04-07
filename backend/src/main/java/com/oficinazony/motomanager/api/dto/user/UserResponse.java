package com.oficinazony.motomanager.api.dto.user;

import com.oficinazony.motomanager.domain.enums.UserRole;

public record UserResponse(
        Integer id,
        String nome,
        String username,
        UserRole role,
        Integer createdByAdminId,
        Boolean ativo
) {
}
