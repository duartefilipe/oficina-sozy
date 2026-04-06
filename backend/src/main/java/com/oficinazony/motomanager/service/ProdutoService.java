package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.produto.ProdutoRequest;
import com.oficinazony.motomanager.api.dto.produto.ProdutoResponse;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {
        return produtoRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProdutoResponse criar(ProdutoRequest request) {
        Produto produto = new Produto();
        aplicarRequest(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizar(Integer id, ProdutoRequest request) {
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado"));
        aplicarRequest(produto, request);
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public void remover(Integer id) {
        if (!produtoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado");
        }
        produtoRepository.deleteById(id);
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
}
