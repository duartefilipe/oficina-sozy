package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.oficina.OficinaRequest;
import com.oficinazony.motomanager.api.dto.oficina.OficinaResponse;
import com.oficinazony.motomanager.api.dto.oficina.OficinaUpdateRequest;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.AppUserRepository;
import com.oficinazony.motomanager.repository.ClienteRepository;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.repository.OrdemServicoRepository;
import com.oficinazony.motomanager.repository.OsCustoExternoRepository;
import com.oficinazony.motomanager.repository.OsMaoObraRepository;
import com.oficinazony.motomanager.repository.OsPecaEstoqueRepository;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import com.oficinazony.motomanager.repository.VendaItemRepository;
import com.oficinazony.motomanager.repository.VendaRepository;
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
    private final OrdemServicoRepository ordemServicoRepository;
    private final OsPecaEstoqueRepository osPecaEstoqueRepository;
    private final OsMaoObraRepository osMaoObraRepository;
    private final OsCustoExternoRepository osCustoExternoRepository;
    private final VendaRepository vendaRepository;
    private final VendaItemRepository vendaItemRepository;
    private final ProdutoRepository produtoRepository;
    private final ClienteRepository clienteRepository;
    private final AppUserRepository appUserRepository;

    public OficinaService(
            OficinaRepository oficinaRepository,
            AuthContextService authContextService,
            OrdemServicoRepository ordemServicoRepository,
            OsPecaEstoqueRepository osPecaEstoqueRepository,
            OsMaoObraRepository osMaoObraRepository,
            OsCustoExternoRepository osCustoExternoRepository,
            VendaRepository vendaRepository,
            VendaItemRepository vendaItemRepository,
            ProdutoRepository produtoRepository,
            ClienteRepository clienteRepository,
            AppUserRepository appUserRepository
    ) {
        this.oficinaRepository = oficinaRepository;
        this.authContextService = authContextService;
        this.ordemServicoRepository = ordemServicoRepository;
        this.osPecaEstoqueRepository = osPecaEstoqueRepository;
        this.osMaoObraRepository = osMaoObraRepository;
        this.osCustoExternoRepository = osCustoExternoRepository;
        this.vendaRepository = vendaRepository;
        this.vendaItemRepository = vendaItemRepository;
        this.produtoRepository = produtoRepository;
        this.clienteRepository = clienteRepository;
        this.appUserRepository = appUserRepository;
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

    @Transactional
    public void remover(Integer id) {
        Oficina oficina = oficinaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oficina nao encontrada"));
        SecurityUser current = authContextService.currentUser();
        if (current.getOficinaId() != null && current.getOficinaId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nao e permitido excluir a oficina vinculada ao usuario logado");
        }

        osPecaEstoqueRepository.deleteByOficinaId(id);
        osMaoObraRepository.deleteByOficinaId(id);
        osCustoExternoRepository.deleteByOficinaId(id);
        vendaItemRepository.deleteByOficinaId(id);
        ordemServicoRepository.deleteByOficinaId(id);
        vendaRepository.deleteByOficinaId(id);
        produtoRepository.deleteByOficinaId(id);
        clienteRepository.deleteByOficinaId(id);
        appUserRepository.desvincularCriadorPorOficina(id);
        appUserRepository.deleteByOficinaId(id);
        oficinaRepository.delete(oficina);
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
