package com.oficinazony.motomanager.api.dto.cliente;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ClienteRequest(
        Integer oficinaId,
        @NotBlank String nome,
        @Size(max = 120) String sobrenome,
        @Size(max = 160) String email,
        @Size(max = 30) String telefone,
        LocalDate dataAniversario,
        @Size(max = 120) String cidade
) {
}
