package com.oficinazony.motomanager.api.dto.venda;

import com.oficinazony.motomanager.domain.enums.VendaStatus;
import jakarta.validation.constraints.NotNull;

public record VendaStatusRequest(@NotNull VendaStatus status) {
}
