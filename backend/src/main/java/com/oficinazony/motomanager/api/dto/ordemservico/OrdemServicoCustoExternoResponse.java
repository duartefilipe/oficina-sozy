package com.oficinazony.motomanager.api.dto.ordemservico;

import java.math.BigDecimal;

public record OrdemServicoCustoExternoResponse(
        Integer id,
        String descricao,
        BigDecimal custoAquisicao,
        BigDecimal valorCobrado
) {
}
