package com.oficinazony.motomanager.api.dto.cliente;

import jakarta.validation.constraints.NotBlank;

public record ClienteRequest(
        Integer oficinaId,
        @NotBlank String nome
) {
}
