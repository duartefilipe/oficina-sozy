package com.oficinazony.motomanager.api.controller;

import com.oficinazony.motomanager.api.dto.relatorio.RelatorioResumoResponse;
import com.oficinazony.motomanager.service.RelatorioService;
import java.time.LocalDate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    public RelatorioController(RelatorioService relatorioService) {
        this.relatorioService = relatorioService;
    }

    @GetMapping("/resumo")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN')")
    public RelatorioResumoResponse resumo(
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim
    ) {
        return relatorioService.resumo(dataInicio, dataFim);
    }
}
