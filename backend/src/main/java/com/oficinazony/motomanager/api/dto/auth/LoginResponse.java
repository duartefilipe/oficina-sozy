package com.oficinazony.motomanager.api.dto.auth;

import com.oficinazony.motomanager.domain.enums.UserRole;

public record LoginResponse(
        String token,
        Integer userId,
        String nome,
        String username,
        UserRole role
) {
}
