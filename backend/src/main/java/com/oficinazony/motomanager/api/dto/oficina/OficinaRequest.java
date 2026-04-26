package com.oficinazony.motomanager.api.dto.oficina;

import jakarta.validation.constraints.NotBlank;

public record OficinaRequest(
        @NotBlank String nome
) {
}
