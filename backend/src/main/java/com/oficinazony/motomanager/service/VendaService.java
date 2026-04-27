package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.venda.VendaItemRequest;
import com.oficinazony.motomanager.api.dto.venda.VendaItemResponse;
import com.oficinazony.motomanager.api.dto.venda.VendaRequest;
import com.oficinazony.motomanager.api.dto.venda.VendaResponse;
import com.oficinazony.motomanager.domain.entity.Cliente;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.domain.entity.Venda;
import com.oficinazony.motomanager.domain.entity.VendaItem;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.domain.enums.VendaStatus;
import com.oficinazony.motomanager.repository.ClienteRepository;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import com.oficinazony.motomanager.repository.VendaItemRepository;
import com.oficinazony.motomanager.repository.VendaRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final VendaItemRepository vendaItemRepository;
    private final ClienteRepository clienteRepository;
    private final OficinaRepository oficinaRepository;
    private final ProdutoRepository produtoRepository;
    private final AuthContextService authContextService;

    public VendaService(
            VendaRepository vendaRepository,
            VendaItemRepository vendaItemRepository,
            ClienteRepository clienteRepository,
            OficinaRepository oficinaRepository,
            ProdutoRepository produtoRepository,
            AuthContextService authContextService
    ) {
        this.vendaRepository = vendaRepository;
        this.vendaItemRepository = vendaItemRepository;
        this.clienteRepository = clienteRepository;
        this.oficinaRepository = oficinaRepository;
        this.produtoRepository = produtoRepository;
        this.authContextService = authContextService;
    }

    @Transactional
    public VendaResponse criar(VendaRequest request) {
        if (request.itens() == null || request.itens().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda deve conter itens");
        }

        Venda venda = new Venda();
        Cliente cliente = resolveClienteParaLancamento(request.clienteId(), request.cliente());
        venda.setClienteRef(cliente);
        venda.setCliente(cliente == null ? null : cliente.getNome());
        venda.setStatus(request.status());
        venda.setValorTotal(BigDecimal.ZERO);
        venda.setOficina(resolveOficinaAtual());
        venda = vendaRepository.save(venda);

        salvarItens(venda, request.itens());
        recalcularTotal(venda);

        if (request.status() == VendaStatus.PAGA) {
            baixarEstoque(venda.getId());
        }
        return buscarPorId(venda.getId());
    }

    @Transactional(readOnly = true)
    public VendaResponse buscarPorId(Integer id) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda nao encontrada"));
        validarAcessoGrupo(venda);
        return montarResposta(venda);
    }

    @Transactional(readOnly = true)
    public List<VendaResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return vendaRepository.findAll().stream().map(this::montarResposta).toList();
        }
        if (current.getOficinaId() == null) {
            return List.of();
        }
        return vendaRepository.findByOficinaId(current.getOficinaId()).stream().map(this::montarResposta).toList();
    }

    @Transactional
    public VendaResponse atualizarStatus(Integer id, VendaStatus novoStatus) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda nao encontrada"));
        validarAcessoGrupo(venda);

        VendaStatus statusAnterior = venda.getStatus();
        venda.setStatus(novoStatus);
        vendaRepository.save(venda);

        if (statusAnterior != VendaStatus.PAGA && novoStatus == VendaStatus.PAGA) {
            baixarEstoque(id);
        }
        return buscarPorId(id);
    }

    @Transactional
    public VendaResponse atualizar(Integer id, VendaRequest request) {
        if (request.itens() == null || request.itens().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda deve conter itens");
        }

        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda nao encontrada"));
        validarAcessoGrupo(venda);

        if (venda.getStatus() != VendaStatus.PENDENTE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Somente vendas pendentes podem ser editadas"
            );
        }

        Cliente cliente = resolveClienteParaLancamento(request.clienteId(), request.cliente());
        venda.setClienteRef(cliente);
        venda.setCliente(cliente == null ? null : cliente.getNome());
        venda.setStatus(request.status());
        vendaRepository.save(venda);

        vendaItemRepository.deleteByVendaId(id);
        salvarItens(venda, request.itens());
        recalcularTotal(venda);

        if (request.status() == VendaStatus.PAGA) {
            baixarEstoque(id);
        }

        return buscarPorId(id);
    }

    private void salvarItens(Venda venda, List<VendaItemRequest> itens) {
        for (VendaItemRequest itemRequest : itens) {
            Produto produto = produtoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado"));
            validarAcessoProduto(produto);
            VendaItem item = new VendaItem();
            item.setVenda(venda);
            item.setProduto(produto);
            item.setQuantidade(itemRequest.quantidade());
            item.setValorUnitario(itemRequest.valorUnitario());
            vendaItemRepository.save(item);
        }
    }

    private void recalcularTotal(Venda venda) {
        BigDecimal total = vendaItemRepository.findByVendaId(venda.getId()).stream()
                .map(item -> item.getValorUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        venda.setValorTotal(total);
        vendaRepository.save(venda);
    }

    private void baixarEstoque(Integer vendaId) {
        List<VendaItem> itens = vendaItemRepository.findByVendaId(vendaId);
        for (VendaItem item : itens) {
            Produto produto = item.getProduto();
            validarAcessoProduto(produto);
            int saldo = produto.getQtdEstoque() - item.getQuantidade();
            if (saldo < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Estoque insuficiente para o produto " + produto.getNome()
                );
            }
            produto.setQtdEstoque(saldo);
            produtoRepository.save(produto);
        }
    }

    private VendaResponse montarResposta(Venda venda) {
        List<VendaItemResponse> itens = vendaItemRepository.findByVendaId(venda.getId()).stream()
                .map(item -> new VendaItemResponse(
                        item.getId(),
                        item.getProduto().getId(),
                        item.getProduto().getNome(),
                        item.getQuantidade(),
                        item.getValorUnitario()
                ))
                .toList();

        return new VendaResponse(
                venda.getId(),
                venda.getClienteRef() == null ? null : venda.getClienteRef().getId(),
                venda.getClienteRef() == null ? venda.getCliente() : venda.getClienteRef().getNome(),
                venda.getDataVenda(),
                venda.getValorTotal(),
                venda.getStatus(),
                itens
        );
    }

    private Cliente resolveClienteParaLancamento(Integer clienteId, String clienteNome) {
        if (clienteId != null) {
            Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente nao encontrado"));
            validarAcessoCliente(cliente);
            return cliente;
        }

        String nome = clienteNome == null ? "" : clienteNome.trim();
        if (nome.isEmpty()) {
            return null;
        }

        SecurityUser current = authContextService.currentUser();
        if (current.getOficinaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario sem oficina vinculada");
        }
        return clienteRepository.findByOficinaIdAndNomeIgnoreCase(current.getOficinaId(), nome)
                .orElseGet(() -> {
                    Cliente novo = new Cliente();
                    novo.setNome(nome);
                    novo.setAtivo(true);
                    novo.setOficina(resolveOficinaAtual());
                    return clienteRepository.save(novo);
                });
    }

    private Oficina resolveOficinaAtual() {
        SecurityUser current = authContextService.currentUser();
        if (current.getOficinaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario sem oficina vinculada");
        }
        return oficinaRepository.findById(current.getOficinaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
    }

    private void validarAcessoGrupo(Venda venda) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (current.getOficinaId() == null || venda.getOficina() == null || !current.getOficinaId().equals(venda.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar esta venda");
        }
    }

    private void validarAcessoProduto(Produto produto) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (produto.getOficina() == null || current.getOficinaId() == null || !current.getOficinaId().equals(produto.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para produto de outra oficina");
        }
    }

    private void validarAcessoCliente(Cliente cliente) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (cliente.getOficina() == null || current.getOficinaId() == null || !current.getOficinaId().equals(cliente.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para cliente de outra oficina");
        }
    }
}
