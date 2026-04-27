package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.cliente.ClienteHistoricoItemResponse;
import com.oficinazony.motomanager.api.dto.cliente.ClienteHistoricoResponse;
import com.oficinazony.motomanager.api.dto.cliente.ClienteRequest;
import com.oficinazony.motomanager.api.dto.cliente.ClienteResponse;
import com.oficinazony.motomanager.api.dto.cliente.ClienteUpdateRequest;
import com.oficinazony.motomanager.domain.entity.Cliente;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.entity.OrdemServico;
import com.oficinazony.motomanager.domain.entity.Venda;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.ClienteRepository;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.repository.OrdemServicoRepository;
import com.oficinazony.motomanager.repository.VendaRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final OficinaRepository oficinaRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final VendaRepository vendaRepository;
    private final AuthContextService authContextService;

    public ClienteService(
            ClienteRepository clienteRepository,
            OficinaRepository oficinaRepository,
            OrdemServicoRepository ordemServicoRepository,
            VendaRepository vendaRepository,
            AuthContextService authContextService
    ) {
        this.clienteRepository = clienteRepository;
        this.oficinaRepository = oficinaRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.vendaRepository = vendaRepository;
        this.authContextService = authContextService;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return clienteRepository.findAll().stream()
                    .sorted(Comparator.comparing(Cliente::getNomeCompleto, String.CASE_INSENSITIVE_ORDER))
                    .map(this::toResponse)
                    .toList();
        }
        if (current.getOficinaId() == null) {
            return List.of();
        }
        return clienteRepository.findByOficinaIdOrderByNomeAsc(current.getOficinaId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        String nomeNormalizado = normalizarNome(request.nome());
        String sobrenomeNormalizado = normalizarTextoOpcional(request.sobrenome());
        Oficina oficina = resolveOficinaParaCriacao(request.oficinaId());
        validarNomeUnico(oficina.getId(), nomeNormalizado, sobrenomeNormalizado, null);

        Cliente cliente = new Cliente();
        cliente.setNome(nomeNormalizado);
        cliente.setSobrenome(sobrenomeNormalizado);
        cliente.setAtivo(true);
        cliente.setOficina(oficina);
        aplicarDadosContato(cliente, request.email(), request.telefone(), request.dataAniversario(), request.cidade());
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(Integer id, ClienteUpdateRequest request) {
        Cliente cliente = buscarEntidadeComAcesso(id);
        String nomeNormalizado = normalizarNome(request.nome());
        String sobrenomeNormalizado = normalizarTextoOpcional(request.sobrenome());
        validarNomeUnico(cliente.getOficina().getId(), nomeNormalizado, sobrenomeNormalizado, cliente.getId());

        cliente.setNome(nomeNormalizado);
        cliente.setSobrenome(sobrenomeNormalizado);
        aplicarDadosContato(cliente, request.email(), request.telefone(), request.dataAniversario(), request.cidade());
        cliente.setAtivo(request.ativo());
        cliente.setAtualizadoEm(LocalDateTime.now());
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void remover(Integer id) {
        Cliente cliente = buscarEntidadeComAcesso(id);
        ordemServicoRepository.desvincularCliente(id);
        vendaRepository.desvincularCliente(id);
        clienteRepository.delete(cliente);
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscar(Integer id) {
        return toResponse(buscarEntidadeComAcesso(id));
    }

    @Transactional(readOnly = true)
    public ClienteHistoricoResponse historico(Integer clienteId) {
        Cliente cliente = buscarEntidadeComAcesso(clienteId);

        List<ClienteHistoricoItemResponse> itens = new ArrayList<>();
        for (OrdemServico os : ordemServicoRepository.findByClienteRefIdOrderByDataAberturaDesc(clienteId)) {
            itens.add(new ClienteHistoricoItemResponse(
                    os.getId(),
                    "ORDEM_SERVICO",
                    "OS #" + os.getId() + " - " + os.getPlacaMoto(),
                    os.getStatus() == null ? "" : os.getStatus().name(),
                    os.getDataAbertura(),
                    os.getValorTotal()
            ));
        }
        for (Venda venda : vendaRepository.findByClienteRefIdOrderByDataVendaDesc(clienteId)) {
            itens.add(new ClienteHistoricoItemResponse(
                    venda.getId(),
                    "VENDA",
                    "Venda #" + venda.getId(),
                    venda.getStatus() == null ? "" : venda.getStatus().name(),
                    venda.getDataVenda(),
                    venda.getValorTotal()
            ));
        }
        itens.sort(Comparator.comparing(ClienteHistoricoItemResponse::data).reversed());

        return new ClienteHistoricoResponse(cliente.getId(), cliente.getNomeCompleto(), itens);
    }

    private Cliente buscarEntidadeComAcesso(Integer id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado"));
        validarAcessoCliente(cliente);
        return cliente;
    }

    private Oficina resolveOficinaAtual() {
        SecurityUser current = authContextService.currentUser();
        if (current.getOficinaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario sem oficina vinculada");
        }
        return oficinaRepository.findById(current.getOficinaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
    }

    private Oficina resolveOficinaParaCriacao(Integer oficinaIdRequest) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            if (oficinaIdRequest == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SUPERADMIN deve informar oficinaId");
            }
            return oficinaRepository.findById(oficinaIdRequest)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
        }
        return resolveOficinaAtual();
    }

    private void validarAcessoCliente(Cliente cliente) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (current.getOficinaId() == null || cliente.getOficina() == null || !current.getOficinaId().equals(cliente.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para cliente de outra oficina");
        }
    }

    private String normalizarNome(String nome) {
        String n = nome == null ? "" : nome.trim();
        if (n.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do cliente e obrigatorio");
        }
        return n;
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String texto = valor.trim();
        return texto.isEmpty() ? null : texto;
    }

    private void aplicarDadosContato(
            Cliente cliente,
            String email,
            String telefone,
            java.time.LocalDate dataAniversario,
            String cidade
    ) {
        cliente.setEmail(normalizarTextoOpcional(email));
        cliente.setTelefone(normalizarTextoOpcional(telefone));
        cliente.setDataAniversario(dataAniversario);
        cliente.setCidade(normalizarTextoOpcional(cidade));
    }

    private void validarNomeUnico(Integer oficinaId, String nome, String sobrenome, Integer clienteAtualId) {
        clienteRepository.findDuplicadoPorNomeCompleto(oficinaId, nome, sobrenome == null ? "" : sobrenome)
                .ifPresent(clienteExistente -> {
                    if (clienteAtualId == null || !clienteAtualId.equals(clienteExistente.getId())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe cliente com este nome nesta oficina");
                    }
                });
    }

    private ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getSobrenome(),
                cliente.getNomeCompleto(),
                cliente.getEmail(),
                cliente.getTelefone(),
                cliente.getDataAniversario(),
                cliente.getCidade(),
                cliente.getOficina() == null ? null : cliente.getOficina().getId(),
                cliente.getOficina() == null ? null : cliente.getOficina().getNome(),
                cliente.isAtivo()
        );
    }
}
