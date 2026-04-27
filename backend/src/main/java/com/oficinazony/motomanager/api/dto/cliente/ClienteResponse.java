package com.oficinazony.motomanager.api.dto.cliente;

public record ClienteResponse(
        Integer id,
        String nome,
        String sobrenome,
        String nomeCompleto,
        String email,
        String telefone,
        java.time.LocalDate dataAniversario,
        String cidade,
        Integer oficinaId,
        String oficinaNome,
        Boolean ativo
) {
}
