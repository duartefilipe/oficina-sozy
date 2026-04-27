package com.oficinazony.motomanager.api.dto.cliente;

import java.util.List;

public record ClienteHistoricoResponse(
        Integer clienteId,
        String clienteNome,
        List<ClienteHistoricoItemResponse> itens
) {
}
