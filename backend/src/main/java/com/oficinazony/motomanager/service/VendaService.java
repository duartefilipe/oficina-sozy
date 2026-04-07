package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.venda.VendaItemRequest;
import com.oficinazony.motomanager.api.dto.venda.VendaItemResponse;
import com.oficinazony.motomanager.api.dto.venda.VendaRequest;
import com.oficinazony.motomanager.api.dto.venda.VendaResponse;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.domain.entity.Venda;
import com.oficinazony.motomanager.domain.entity.VendaItem;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.domain.enums.VendaStatus;
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
    private final ProdutoRepository produtoRepository;
    private final AuthContextService authContextService;

    public VendaService(
            VendaRepository vendaRepository,
            VendaItemRepository vendaItemRepository,
            ProdutoRepository produtoRepository,
            AuthContextService authContextService
    ) {
        this.vendaRepository = vendaRepository;
        this.vendaItemRepository = vendaItemRepository;
        this.produtoRepository = produtoRepository;
        this.authContextService = authContextService;
    }

    @Transactional
    public VendaResponse criar(VendaRequest request) {
        if (request.itens() == null || request.itens().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venda deve conter itens");
        }

        Venda venda = new Venda();
        venda.setCliente(request.cliente());
        venda.setStatus(request.status());
        venda.setValorTotal(BigDecimal.ZERO);
        venda.setAdminGroupId(resolveAdminGroupId());
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
        return vendaRepository.findByAdminGroupId(current.getAdminGroupId()).stream().map(this::montarResposta).toList();
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

    private void salvarItens(Venda venda, List<VendaItemRequest> itens) {
        for (VendaItemRequest itemRequest : itens) {
            Produto produto = produtoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado"));
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
                venda.getCliente(),
                venda.getDataVenda(),
                venda.getValorTotal(),
                venda.getStatus(),
                itens
        );
    }

    private Integer resolveAdminGroupId() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return null;
        }
        return current.getAdminGroupId();
    }

    private void validarAcessoGrupo(Venda venda) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (current.getAdminGroupId() == null || !current.getAdminGroupId().equals(venda.getAdminGroupId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar esta venda");
        }
    }
}
