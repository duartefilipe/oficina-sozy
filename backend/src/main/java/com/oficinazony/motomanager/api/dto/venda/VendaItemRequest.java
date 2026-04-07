package com.oficinazony.motomanager.api.dto.venda;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record VendaItemRequest(
        @NotNull Integer produtoId,
        @NotNull @Min(1) Integer quantidade,
        @NotNull BigDecimal valorUnitario
) {
}
