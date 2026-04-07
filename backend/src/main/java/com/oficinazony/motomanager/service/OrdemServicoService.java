package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoCustoExternoRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoCustoExternoResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoMaoObraRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoMaoObraResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoPecaRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoPecaResponse;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoRequest;
import com.oficinazony.motomanager.api.dto.ordemservico.OrdemServicoResponse;
import com.oficinazony.motomanager.domain.entity.OrdemServico;
import com.oficinazony.motomanager.domain.entity.OsCustoExterno;
import com.oficinazony.motomanager.domain.entity.OsMaoObra;
import com.oficinazony.motomanager.domain.entity.OsPecaEstoque;
import com.oficinazony.motomanager.domain.entity.Produto;
import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.repository.OrdemServicoRepository;
import com.oficinazony.motomanager.repository.OsCustoExternoRepository;
import com.oficinazony.motomanager.repository.OsMaoObraRepository;
import com.oficinazony.motomanager.repository.OsPecaEstoqueRepository;
import com.oficinazony.motomanager.repository.ProdutoRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.math.BigDecimal;
import java.util.List;
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
    private final ProdutoRepository produtoRepository;
    private final AuthContextService authContextService;

    public OrdemServicoService(
            OrdemServicoRepository ordemServicoRepository,
            OsPecaEstoqueRepository osPecaEstoqueRepository,
            OsMaoObraRepository osMaoObraRepository,
            OsCustoExternoRepository osCustoExternoRepository,
            ProdutoRepository produtoRepository,
            AuthContextService authContextService
    ) {
        this.ordemServicoRepository = ordemServicoRepository;
        this.osPecaEstoqueRepository = osPecaEstoqueRepository;
        this.osMaoObraRepository = osMaoObraRepository;
        this.osCustoExternoRepository = osCustoExternoRepository;
        this.produtoRepository = produtoRepository;
        this.authContextService = authContextService;
    }

    @Transactional
    public OrdemServicoResponse criar(OrdemServicoRequest request) {
        OrdemServico os = new OrdemServico();
        os.setPlacaMoto(request.placaMoto());
        os.setCliente(request.cliente());
        os.setStatus(request.status());
        os.setAdminGroupId(resolveAdminGroupId());
        os = ordemServicoRepository.save(os);

        salvarPecas(os, request.pecasEstoque());
        salvarServicos(os, request.servicos());
        salvarCustosExternos(os, request.custosExternos());
        recalcularTotal(os);

        if (ehStatusDeBaixa(os.getStatus())) {
            baixarEstoquePecas(os.getId());
        }
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
                : ordemServicoRepository.findByAdminGroupId(current.getAdminGroupId());
        return ordens.stream().map(this::montarResposta).toList();
    }

    @Transactional
    public OrdemServicoResponse atualizarStatus(Integer id, OrdemServicoStatus novoStatus) {
        OrdemServico os = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OS nao encontrada"));
        validarAcessoGrupo(os);

        OrdemServicoStatus statusAnterior = os.getStatus();
        os.setStatus(novoStatus);
        ordemServicoRepository.save(os);

        if (!ehStatusDeBaixa(statusAnterior) && ehStatusDeBaixa(novoStatus)) {
            baixarEstoquePecas(id);
        }

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

        os.setPlacaMoto(request.placaMoto());
        os.setCliente(request.cliente());
        os.setStatus(request.status());
        ordemServicoRepository.save(os);

        osPecaEstoqueRepository.deleteByOrdemServicoId(id);
        osMaoObraRepository.deleteByOrdemServicoId(id);
        osCustoExternoRepository.deleteByOrdemServicoId(id);

        salvarPecas(os, request.pecasEstoque());
        salvarServicos(os, request.servicos());
        salvarCustosExternos(os, request.custosExternos());
        recalcularTotal(os);

        if (ehStatusDeBaixa(os.getStatus())) {
            baixarEstoquePecas(id);
        }
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
            OsPecaEstoque peca = new OsPecaEstoque();
            peca.setOrdemServico(os);
            peca.setProduto(produto);
            peca.setQuantidade(item.quantidade());
            peca.setValorCobrado(item.valorCobrado());
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

    private void baixarEstoquePecas(Integer ordemServicoId) {
        List<OsPecaEstoque> pecas = osPecaEstoqueRepository.findByOrdemServicoId(ordemServicoId);
        for (OsPecaEstoque item : pecas) {
            Produto produto = item.getProduto();
            int novoSaldo = produto.getQtdEstoque() - item.getQuantidade();
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
                os.getCliente(),
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

    private Integer resolveAdminGroupId() {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return null;
        }
        return current.getAdminGroupId();
    }

    private void validarAcessoGrupo(OrdemServico os) {
        SecurityUser current = authContextService.currentUser();
        if (current.getRole() == UserRole.SUPERADMIN) {
            return;
        }
        if (current.getAdminGroupId() == null || !current.getAdminGroupId().equals(os.getAdminGroupId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sem permissao para acessar esta OS");
        }
    }
}
