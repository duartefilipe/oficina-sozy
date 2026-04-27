package com.oficinazony.motomanager.api.dto.cliente;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClienteHistoricoItemResponse(
        Integer id,
        String tipo,
        String descricao,
        String status,
        LocalDateTime data,
        BigDecimal valorTotal
) {
}
