package com.oficinazony.motomanager.api.dto.venda;

import java.math.BigDecimal;

public record VendaItemResponse(
        Integer id,
        Integer produtoId,
        String produtoNome,
        Integer quantidade,
        BigDecimal valorUnitario
) {
}
