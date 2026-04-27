package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoCustoExternoRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoCustoExternoResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoMaoObraRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoMaoObraResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoPecaRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoPecaResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoResponse;
import com.oficinazony.motomanager.domain.entity.Cliente;
import com.oficinazony.motomanager.domain.entity.Oficina;
import com.oficinazony.motomanager.domain.entity.OrdemServico;
import com.oficinazony.motomanager.domain.entity.OsCustoExterno;
import com.oficinazony.motomanager.domain.entity.OsMaoObra;
import com.oficinazony.motomanager.domain.entity.OsPecaEstoque;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.ClienteRepository;
import com.oficinazony.motomanager.repository.OficinaRepository;
import com.oficinazony.motomanager.repository.OrdemServicoRepository;
import com.oficinazony.motomanager.repository.OsCustoExternoRepository;
import com.oficinazony.motomanager.repository.OsMaoObraRepository;
import com.oficinazony.motomanager.repository.OsPecaEstoqueRepository;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final OsPecaEstoqueRepository osPecaEstoqueRepository;
    private final OsMaoObraRepository osMaoObraRepository;
    private final OsCustoExternoRepository osCustoExternoRepository;
    private final OficinaRepository oficinaRepository;
    private final ClienteRepository clienteRepository;
    private final ProdutoRepository produtoRepository;
    private final AuthContextService authContextService;

    public OrdemServicoService(
            OrdemServicoRepository ordemServicoRepository,
            OsPecaEstoqueRepository osPecaEstoqueRepository,
            OsMaoObraRepository osMaoObraRepository,
            OsCustoExternoRepository osCustoExternoRepository,
            OficinaRepository oficinaRepository,
            ClienteRepository clienteRepository,
            ProdutoRepository produtoRepository,
            AuthContextService authContextService
    ) {
        this.ordemServicoRepository = ordemServicoRepository;
        this.osPecaEstoqueRepository = osPecaEstoqueRepository;
        this.osMaoObraRepository = osMaoObraRepository;
        this.osCustoExternoRepository = osCustoExternoRepository;
        this.oficinaRepository = oficinaRepository;
        this.clienteRepository = clienteRepository;
        this.produtoRepository = produtoRepository;
        this.authContextService = authContextService;
    }

    @Transactional
    public OrdemServicoResponse criar(OrdemServicoRequest request) {
        OrdemServico os = new OrdemServico();
        Cliente cliente = resolveClienteParaLancamento(request.clienteId(), request.cliente());
        os.setPlacaMoto(request.placaMoto());
        os.setClienteRef(cliente);
        os.setCliente(cliente == null ? null : cliente.getNome());
        os.setStatus(request.status());
        os.setOficina(resolveOficinaAtual());
        os = ordemServicoRepository.save(os);

        aplicarMudancaEstoquePecas(Map.of(), agregarPecasPorProdutoRequest(request.pecasEstoque()));
        salvarPecas(os, request.pecasEstoque());
        salvarServicos(os, request.servicos());
        salvarCustosExternos(os, request.custosExternos());
        recalcularTotal(os);
        return buscarPorId(os.getId());
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse buscarPorId(Integer id) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);
        return montarResposta(os);
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoResponse> listar() {
        SecurityUser current = authContextService.currentUser();
        List<OrdemServico> ordens = current.getRole() == UserRole.SUPERADMIN
                ? ordemServicoRepository.findAll()
                : (current.getOficinaId() == null ? List.of() : ordemServicoRepository.findByOficinaId(current.getOficinaId()));
        return ordens.stream().map(this::montarResposta).toList();
    }

    @Transactional
    public OrdemServicoResponse atualizarStatus(Integer id, OrdemServicoStatus novoStatus) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);

        os.setStatus(novoStatus);
        ordemServicoRepository.save(os);

        recalcularTotal(os);
        return buscarPorId(id);
    }

    @Transactional
    public OrdemServicoResponse recalcular(Integer id) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);
        recalcularTotal(os);
        return buscarPorId(id);
    }

    @Transactional
    public OrdemServicoResponse atualizar(Integer id, OrdemServicoRequest request) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);
        if (ehStatusDeBaixa(os.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nao e permitido editar OS finalizada/paga. Ajuste apenas o status."
            );
        }

        List<OsPecaEstoque> linhasPecasAntes = osPecaEstoqueRepository.findByOrdemServicoId(id);
        aplicarMudancaEstoquePecas(agregarPecasPorProdutoEntidades(linhasPecasAntes), agregarPecasPorProdutoRequest(request.pecasEstoque()));

        Cliente cliente = resolveClienteParaLancamento(request.clienteId(), request.cliente());
        os.setPlacaMoto(request.placaMoto());
        os.setClienteRef(cliente);
        os.setCliente(cliente == null ? null : cliente.getNome());
        os.setStatus(request.status());
        ordemServicoRepository.save(os);

        osPecaEstoqueRepository.deleteByOrdemServicoId(id);
        osMaoObraRepository.deleteByOrdemServicoId(id);
        osCustoExternoRepository.deleteByOrdemServicoId(id);

        salvarPecas(os, request.pecasEstoque());
        salvarServicos(os, request.servicos());
        salvarCustosExternos(os, request.custosExternos());
        recalcularTotal(os);
        return buscarPorId(id);
    }

    @Transactional
    public void remover(Integer id) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);
        if (ehStatusDeBaixa(os.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nao e permitido remover OS finalizada/paga para preservar consistencia de estoque."
            );
        }

        List<OsPecaEstoque> linhasPecas = osPecaEstoqueRepository.findByOrdemServicoId(id);
        aplicarMudancaEstoquePecas(agregarPecasPorProdutoEntidades(linhasPecas), Map.of());

        osPecaEstoqueRepository.deleteByOrdemServicoId(id);
        osMaoObraRepository.deleteByOrdemServicoId(id);
        osCustoExternoRepository.deleteByOrdemServicoId(id);
        ordemServicoRepository.delete(os);
    }

    private void salvarPecas(OrdemServico os, List<OrdemServicoPecaRequest> itens) {
        if (itens == null || itens.isEmpty()) {
            return;
        }
        for (OrdemServicoPecaRequest item : itens) {
            Produto produto = produtoRepository.findById(item.produtoId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado"));
            validarAcessoProduto(produto);
            OsPecaEstoque peca = new OsPecaEstoque();
            peca.setOrdemServico(os);
            peca.setProduto(produto);
            peca.setQuantidade(item.quantidade());
            /* Valor de cobranca acompanha o cadastro do estoque (preco de venda), nao o payload. */
            peca.setValorCobrado(produto.getPrecoVenda());
            osPecaEstoqueRepository.save(peca);
        }
    }

    private void salvarServicos(OrdemServico os, List<OrdemServicoMaoObraRequest> servicos) {
        if (servicos == null || servicos.isEmpty()) {
            return;
        }
        for (OrdemServicoMaoObraRequest item : servicos) {
            OsMaoObra servico = new OsMaoObra();
            servico.setOrdemServico(os);
            servico.setDescricao(item.descricao());
            servico.setValor(item.valor());
            osMaoObraRepository.save(servico);
        }
    }

    private void salvarCustosExternos(OrdemServico os, List<OrdemServicoCustoExternoRequest> custosExternos) {
        if (custosExternos == null || custosExternos.isEmpty()) {
            return;
        }
        for (OrdemServicoCustoExternoRequest item : custosExternos) {
            OsCustoExterno custo = new OsCustoExterno();
            custo.setOrdemServico(os);
            custo.setDescricao(item.descricao());
            custo.setCustoAquisicao(item.custoAquisicao());
            custo.setValorCobrado(item.valorCobrado());
            osCustoExternoRepository.save(custo);
        }
    }

    private void recalcularTotal(OrdemServico os) {
        BigDecimal totalPecas = osPecaEstoqueRepository.findByOrdemServicoId(os.getId()).stream()
                .map(item -> item.getValorCobrado().multiply(BigDecimal.valueOf(item.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalServicos = osMaoObraRepository.findByOrdemServicoId(os.getId()).stream()
                .map(OsMaoObra::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCustosExternos = osCustoExternoRepository.findByOrdemServicoId(os.getId()).stream()
                .map(OsCustoExterno::getValorCobrado)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        os.setValorTotal(totalPecas.add(totalServicos).add(totalCustosExternos));
        ordemServicoRepository.save(os);
    }

    /** Ajusta estoque pela diferenca entre o que a OS pedia antes e o pedido novo. */
    private void aplicarMudancaEstoquePecas(
            Map<Integer, Integer> quantidadeAntesPorProduto, Map<Integer, Integer> quantidadeNovoPorProduto) {
        Set<Integer> produtoIds = new HashSet<>();
        produtoIds.addAll(quantidadeAntesPorProduto.keySet());
        produtoIds.addAll(quantidadeNovoPorProduto.keySet());
        for (Integer produtoId : produtoIds) {
            int qAntes = quantidadeAntesPorProduto.getOrDefault(produtoId, 0);
            int qNovo = quantidadeNovoPorProduto.getOrDefault(produtoId, 0);
            int delta = qNovo - qAntes;
            if (delta == 0) {
                continue;
            }
            Produto produto = produtoRepository.findById(produtoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado: " + produtoId));
            validarAcessoProduto(produto);
            int novoSaldo = produto.getQtdEstoque() - delta;
            if (novoSaldo < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Estoque insuficiente para o produto " + produto.getNome()
                );
            }
            produto.setQtdEstoque(novoSaldo);
            produtoRepository.save(produto);
        }
    }

    private Map<Integer, Integer> agregarPecasPorProdutoRequest(List<OrdemServicoPecaRequest> itens) {
        if (itens == null || itens.isEmpty()) {
            return Map.of();
        }
        return itens.stream()
                .collect(Collectors.groupingBy(OrdemServicoPecaRequest::produtoId, Collectors.summingInt(OrdemServicoPecaRequest::quantidade)));
    }

    private Map<Integer, Integer> agregarPecasPorProdutoEntidades(List<OsPecaEstoque> itens) {
        if (itens == null || itens.isEmpty()) {
            return new HashMap<>();
        }
        Map<Integer, Integer> m = new HashMap<>();
        for (OsPecaEstoque linha : itens) {
            int pid = linha.getProduto().getId();
            m.merge(pid, linha.getQuantidade(), Integer::sum);
        }
        return m;
    }

    private OrdemServicoResponse montarResposta(OrdemServico os) {
        List<OrdemServicoPecaResponse> pecas = osPecaEstoqueRepository.findByOrdemServicoId(os.getId()).stream()
                .map(item -> new OrdemServicoPecaResponse(
                        item.getId(),
                        item.getProduto().getId(),
                        item.getProduto().getNome(),
                        item.getQuantidade(),
                        item.getValorCobrado()
                ))
                .toList();

        List<OrdemServicoMaoObraResponse> servicos = osMaoObraRepository.findByOrdemServicoId(os.getId()).stream()
                .map(item -> new OrdemServicoMaoObraResponse(item.getId(), item.getDescricao(), item.getValor()))
                .toList();

        List<OrdemServicoCustoExternoResponse> custosExternos = osCustoExternoRepository.findByOrdemServicoId(os.getId()).stream()
                .map(item -> new OrdemServicoCustoExternoResponse(
                        item.getId(),
                        item.getDescricao(),
                        item.getCustoAquisicao(),
                        item.getValorCobrado()
                ))
                .toList();

        return new OrdemServicoResponse(
                os.getId(),
                os.getPlacaMoto(),
                os.getClienteRef() == null ? null : os.getClienteRef().getId(),
                os.getClienteRef() == null ? os.getCliente() : os.getClienteRef().getNome(),
                os.getStatus(),
                os.getDataAbertura(),
                os.getValorTotal(),
                pecas,
                servicos,
                custosExternos
        );
    }

    private boolean ehStatusDeBaixa(OrdemServicoStatus status) {
        return status == OrdemServicoStatus.FINALIZADA || status == OrdemServicoStatus.PAGA;
    }

    private Oficina resolveOficinaAtual() {
        SecurityUser current = authContextService.currentUser();
        if (current.getOficinaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario sem oficina vinculada");
        }
        return oficinaRepository.findById(current.getOficinaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Oficina nao encontrada"));
    }

    private void validarAcessoGrupo(OrdemServico os) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (current.getOficinaId() == null || os.getOficina() == null || !current.getOficinaId().equals(os.getOficina().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar esta OS");
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
