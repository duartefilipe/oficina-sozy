package com.oficinazony.motomanager.api.dto.ordemservico;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record OrdemServicoCustoExternoRequest(
        @NotBlank String descricao,
        @NotNull BigDecimal custoAquisicao,
        @NotNull BigDecimal valorCobrado
) {
}
