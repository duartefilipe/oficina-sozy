package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.oficina.OficinaRequest;
import com.oficinazony.motomanager.api.dto.oficina.OficinaResponse;
import com.oficinazony.motomanager.api.dto.oficina.OficinaUpdateRequest;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OficinaService {

    private final OficinaRepository oficinaRepository;
    private final AuthContextService authContextService;

    public OficinaService(OficinaRepository oficinaRepository, AuthContextService authContextService) {
        this.oficinaRepository = oficinaRepository;
        this.authContextService = authContextService;
    }

    @Transactional(readOnly = true)
    public List<OficinaResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return oficinaRepository.findAll().stream().map(this::toResponse).toList();
        }
        if (current.getOficinaId() == null) {
            return List.of();
        }
        return oficinaRepository.findById(current.getOficinaId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public OficinaResponse criar(OficinaRequest request) {
        validarNomeUnico(request.nome(), null);
        Oficina oficina = new Oficina();
        oficina.setNome(request.nome().trim());
        oficina.setAtivo(true);
        return toResponse(oficinaRepository.save(oficina));
    }

    @Transactional
    public OficinaResponse atualizar(Integer id, OficinaUpdateRequest request) {
        Oficina oficina = oficinaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oficina nao encontrada"));
        validarNomeUnico(request.nome(), id);
        oficina.setNome(request.nome().trim());
        oficina.setAtivo(request.ativo());
        oficina.setAtualizadoEm(LocalDateTime.now());
        return toResponse(oficinaRepository.save(oficina));
    }

    private void validarNomeUnico(String nome, Integer atualId) {
        oficinaRepository.findByNomeIgnoreCase(nome.trim())
                .filter(oficina -> atualId == null || !oficina.getId().equals(atualId))
                .ifPresent(oficina -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de oficina ja cadastrado");
                });
    }

    private OficinaResponse toResponse(Oficina oficina) {
        return new OficinaResponse(oficina.getId(), oficina.getNome(), oficina.getAtivo());
    }
}
