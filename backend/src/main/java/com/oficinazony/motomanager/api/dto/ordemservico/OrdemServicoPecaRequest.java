package com.oficinazony.motomanager.api.dto.ordemservico;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record OrdemServicoPecaRequest(
        @NotNull Integer produtoId,
        @NotNull @Min(1) Integer quantidade,
        @NotNull BigDecimal valorCobrado
) {
}
