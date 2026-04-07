package com.oficinazony.motomanager.api.dto.relatorio;

import java.math.BigDecimal;

public record RelatorioResumoResponse(
        BigDecimal receitaTotal,
        BigDecimal despesaTotal,
        BigDecimal resultadoLucroPrejuizo,
        BigDecimal receitaVendas,
        BigDecimal custoVendas,
        BigDecimal lucroVendas,
        BigDecimal receitaOrdensServico,
        BigDecimal custoOrdensServico,
        Long quantidadeVendas,
        Long quantidadeConsertosMoto,
        Long quantidadePecasVendidas,
        Long quantidadeVendasPendentes,
        Long quantidadeOsAbertas,
        BigDecimal ticketMedioVendas,
        BigDecimal ticketMedioOs
) {
}
