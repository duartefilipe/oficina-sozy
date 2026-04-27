package com.oficinazony.motomanager.api.dto.venda;

import com.oficinazony.motomanager.domain.enums.VendaStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record VendaRequest(
        Integer clienteId,
        String cliente,
        @NotNull VendaStatus status,
        @Valid List<VendaItemRequest> itens
) {
}
