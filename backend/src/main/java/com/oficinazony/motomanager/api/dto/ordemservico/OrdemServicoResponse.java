package com.oficinazony.motomanager.api.dto.ordemservico;

import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrdemServicoResponse(
        Integer id,
        String placaMoto,
        Integer clienteId,
        String cliente,
        OrdemServicoStatus status,
        LocalDateTime dataAbertura,
        BigDecimal valorTotal,
        List<OrdemServicoPecaResponse> pecasEstoque,
        List<OrdemServicoMaoObraResponse> servicos,
        List<OrdemServicoCustoExternoResponse> custosExternos
) {
}
