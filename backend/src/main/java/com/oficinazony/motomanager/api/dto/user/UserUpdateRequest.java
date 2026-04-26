package com.oficinazony.motomanager.api.dto.user;

import com.oficinazony.motomanager.domain.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserUpdateRequest(
        @NotBlank String nome,
        @NotBlank String username,
        String password,
        @NotNull UserRole role,
        Integer createdByAdminId,
        Integer oficinaId,
        @NotNull Boolean ativo
) {
}
