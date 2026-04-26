package com.oficinazony.motomanager.api.dto.oficina;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OficinaUpdateRequest(
        @NotBlank String nome,
        @NotNull Boolean ativo
) {
}
