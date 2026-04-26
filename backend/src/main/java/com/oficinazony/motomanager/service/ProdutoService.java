package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.produto.ProdutoRequest;
import com.oficinazony.motomanager.api.dto.produto.ProdutoResponse;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final OficinaRepository oficinaRepository;
    private final AuthContextService authContextService;

    public ProdutoService(
            ProdutoRepository produtoRepository,
            OficinaRepository oficinaRepository,
            AuthContextService authContextService
    ) {
        this.produtoRepository = produtoRepository;
        this.oficinaRepository = oficinaRepository;
        this.authContextService = authContextService;
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        List<Produto> produtos = current.getRole() == UserRole.SUPERADMIN
                ? produtoRepository.findAll()
                : (current.getOficinaId() == null ? List.of() : produtoRepository.findByOficinaId(current.getOficinaId()));
        return produtos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        Produto produto = new Produto();
        produto.setOficina(resolveOficinaAtual());
        aplicarRequest(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizar(Integer id, ProdutoRequest request) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado"));
        validarAcessoProduto(produto);
        aplicarRequest(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public void remover(Integer id) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado"));
        validarAcessoProduto(produto);
        produtoRepository.delete(produto);
    }

    private void aplicarRequest(Produto produto, ProdutoRequest request) {
        produto.setSku(request.sku());
        produto.setNome(request.nome());
        produto.setTipo(request.tipo());
        produto.setPrecoCusto(request.precoCusto());
        produto.setPrecoVenda(request.precoVenda());
        produto.setQtdEstoque(request.qtdEstoque());
        produto.setChassi(request.chassi());
        produto.setRenavam(request.renavam());
        produto.setAno(request.ano());
    }

    private ProdutoResponse toResponse(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getSku(),
                produto.getNome(),
                produto.getTipo(),
                produto.getPrecoCusto(),
                produto.getPrecoVenda(),
                produto.getQtdEstoque(),
                produto.getChassi(),
                produto.getRenavam(),
                produto.getAno()
        );
    }

    private Oficina resolveOficinaAtual() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            if (current.getOficinaId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe oficina para criar produto");
            }
        }
        if (current.getOficinaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario sem oficina vinculada");
        }
        return oficinaRepository.findById(current.getOficinaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
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
}
