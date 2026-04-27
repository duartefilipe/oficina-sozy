package com.oficinazony.motomanager.api.dto.cliente;

public record ClienteResponse(
        Integer id,
        String nome,
        Boolean ativo
) {
}
