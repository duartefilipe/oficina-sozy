package com.oficinazony.motomanager.api.controller;

import com.oficinazony.motomanager.api.dto.oficina.OficinaRequest;
import com.oficinazony.motomanager.api.dto.oficina.OficinaResponse;
import com.oficinazony.motomanager.api.dto.oficina.OficinaUpdateRequest;
import com.oficinazony.motomanager.service.OficinaService;
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
@RequestMapping("/api/oficinas")
public class OficinaController {

    private final OficinaService oficinaService;

    public OficinaController(OficinaService oficinaService) {
        this.oficinaService = oficinaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN')")
    public List<OficinaResponse> listar() {
        return oficinaService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SUPERADMIN')")
    public OficinaResponse criar(@Valid @RequestBody OficinaRequest request) {
        return oficinaService.criar(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public OficinaResponse atualizar(@PathVariable Integer id, @Valid @RequestBody OficinaUpdateRequest request) {
        return oficinaService.atualizar(id, request);
    }
}
