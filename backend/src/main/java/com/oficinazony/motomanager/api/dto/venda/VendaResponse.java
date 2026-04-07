package com.oficinazony.motomanager.api.dto.venda;

import com.oficinazony.motomanager.domain.enums.VendaStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VendaResponse(
        Integer id,
        String cliente,
        LocalDateTime dataVenda,
        BigDecimal valorTotal,
        VendaStatus status,
        List<VendaItemResponse> itens
) {
}
