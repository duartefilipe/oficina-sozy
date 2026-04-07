package com.oficinazony.motomanager.api.controller;

import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoStatusRequest;
import com.oficinazony.motomanager.service.OrdemServicoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    public OrdemServicoController(OrdemServicoService ordemServicoService) {
        this.ordemServicoService = ordemServicoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public List<OrdemServicoResponse> listar() {
        return ordemServicoService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public OrdemServicoResponse criar(@Valid @RequestBody OrdemServicoRequest request) {
        return ordemServicoService.criar(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public OrdemServicoResponse buscarPorId(@PathVariable Integer id) {
        return ordemServicoService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public OrdemServicoResponse atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody OrdemServicoRequest request
    ) {
        return ordemServicoService.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public OrdemServicoResponse atualizarStatus(
            @PathVariable Integer id,
            @Valid @RequestBody OrdemServicoStatusRequest request
    ) {
        return ordemServicoService.atualizarStatus(id, request.status());
    }

    @PostMapping("/{id}/recalcular")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public OrdemServicoResponse recalcular(@PathVariable Integer id) {
        return ordemServicoService.recalcular(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public void remover(@PathVariable Integer id) {
        ordemServicoService.remover(id);
    }
}
