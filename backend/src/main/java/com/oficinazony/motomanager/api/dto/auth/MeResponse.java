package com.oficinazony.motomanager.api.dto.auth;

import com.oficinazony.motomanager.domain.enums.UserRole;

public record MeResponse(
        Integer userId,
        String nome,
        String username,
        UserRole role,
        Integer oficinaId,
        String oficinaNome
) {
}
