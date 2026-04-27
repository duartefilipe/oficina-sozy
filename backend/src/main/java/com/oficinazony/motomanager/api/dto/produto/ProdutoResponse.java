package com.oficinazony.motomanager.api.dto.produto;

import com.oficinazony.motomanager.domain.enums.ProdutoTipo;
import java.math.BigDecimal;

public record ProdutoResponse(
        Integer id,
        String sku,
        String nome,
        Integer oficinaId,
        String oficinaNome,
        ProdutoTipo tipo,
        BigDecimal precoCusto,
        BigDecimal precoVenda,
        Integer qtdEstoque,
        String chassi,
        String renavam,
        Integer ano
) {
}
