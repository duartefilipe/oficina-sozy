package com.oficinazony.motomanager.api.dto.ordemservico;

import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record OrdemServicoRequest(
        @NotBlank String placaMoto,
        String cliente,
        @NotNull OrdemServicoStatus status,
        @Valid List<OrdemServicoPecaRequest> pecasEstoque,
        @Valid List<OrdemServicoMaoObraRequest> servicos,
        @Valid List<OrdemServicoCustoExternoRequest> custosExternos
) {
}
