package com.oficinazony.motomanager.api.dto.ordemservico;

import java.math.BigDecimal;

public record OrdemServicoMaoObraResponse(
        Integer id,
        String descricao,
        BigDecimal valor
) {
}
