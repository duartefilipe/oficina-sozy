package com.oficinazony.motomanager.api.controller;

import com.oficinazony.motomanager.api.dto.cliente.ClienteHistoricoResponse;
import com.oficinazony.motomanager.api.dto.cliente.ClienteRequest;
import com.oficinazony.motomanager.api.dto.cliente.ClienteResponse;
import com.oficinazony.motomanager.api.dto.cliente.ClienteUpdateRequest;
import com.oficinazony.motomanager.service.ClienteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public List<ClienteResponse> listar() {
        return clienteService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public ClienteResponse criar(@Valid @RequestBody ClienteRequest request) {
        return clienteService.criar(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public ClienteResponse atualizar(@PathVariable Integer id, @Valid @RequestBody ClienteUpdateRequest request) {
        return clienteService.atualizar(id, request);
    }

    @GetMapping("/{id}/historico")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN','USUARIO')")
    public ClienteHistoricoResponse historico(@PathVariable Integer id) {
        return clienteService.historico(id);
    }
}
