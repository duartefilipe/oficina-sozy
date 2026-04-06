package com.oficinazony.motomanager.api.dto.ordemservico;

import java.math.BigDecimal;

public record OrdemServicoPecaResponse(
        Integer id,
        Integer produtoId,
        String produtoNome,
        Integer quantidade,
        BigDecimal valorCobrado
) {
}
