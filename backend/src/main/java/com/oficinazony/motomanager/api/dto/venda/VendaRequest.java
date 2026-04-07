package com.oficinazony.motomanager.api.dto.venda;

import com.oficinazony.motomanager.domain.enums.VendaStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record VendaRequest(
        String cliente,
        @NotNull VendaStatus status,
        @Valid List<VendaItemRequest> itens
) {
}
