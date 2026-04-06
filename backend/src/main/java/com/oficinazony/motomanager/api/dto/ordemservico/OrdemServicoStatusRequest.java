package com.oficinazony.motomanager.api.dto.ordemservico;

import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import jakarta.validation.constraints.NotNull;

public record OrdemServicoStatusRequest(@NotNull OrdemServicoStatus status) {
}
