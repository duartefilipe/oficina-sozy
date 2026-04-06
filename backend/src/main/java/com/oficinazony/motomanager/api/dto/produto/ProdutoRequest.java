package com.oficinazony.motomanager.api.dto.produto;

import com.oficinazony.motomanager.domain.enums.ProdutoTipo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProdutoRequest(
        String sku,
        @NotBlank String nome,
        @NotNull ProdutoTipo tipo,
        @NotNull BigDecimal precoCusto,
        @NotNull BigDecimal precoVenda,
        @NotNull @Min(0) Integer qtdEstoque,
        String chassi,
        String renavam,
        Integer ano
) {
}
