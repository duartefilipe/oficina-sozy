package com.oficinazony.motomanager.api.controller;

import com.oficinazony.motomanager.api.dto.venda.VendaRequest;
import com.oficinazony.motomanager.api.dto.venda.VendaResponse;
import com.oficinazony.motomanager.api.dto.venda.VendaStatusRequest;
import com.oficinazony.motomanager.service.VendaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    private final VendaService vendaService;

    public VendaController(VendaService vendaService) {
        this.vendaService = vendaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public VendaResponse criar(@Valid @RequestBody VendaRequest request) {
        return vendaService.criar(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public List<VendaResponse> listar() {
        return vendaService.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public VendaResponse buscarPorId(@PathVariable Integer id) {
        return vendaService.buscarPorId(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public VendaResponse atualizarStatus(
            @PathVariable Integer id,
            @Valid @RequestBody VendaStatusRequest request
    ) {
        return vendaService.atualizarStatus(id, request.status());
    }
}
