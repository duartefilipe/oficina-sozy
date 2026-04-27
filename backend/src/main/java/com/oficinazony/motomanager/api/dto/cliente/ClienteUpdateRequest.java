package com.oficinazony.motomanager.api.dto.cliente;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClienteUpdateRequest(
        @NotBlank String nome,
        @NotNull Boolean ativo
) {
}
