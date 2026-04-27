package com.oficinazony.motomanager.service;

import com.oficinazony.motomanager.api.dto.relatorio.RelatorioResumoResponse;
import com.oficinazony.motomanager.domain.entity.OrdemServico;
import com.oficinazony.motomanager.domain.entity.OsCustoExterno;
import com.oficinazony.motomanager.domain.entity.OsPecaEstoque;
import com.oficinazony.motomanager.domain.entity.Venda;
import com.oficinazony.motomanager.domain.entity.VendaItem;
import com.oficinazony.motomanager.domain.enums.OrdemServicoStatus;
import com.oficinazony.motomanager.domain.enums.UserRole;
import com.oficinazony.motomanager.domain.enums.VendaStatus;
import com.oficinazony.motomanager.repository.OrdemServicoRepository;
import com.oficinazony.motomanager.repository.OsCustoExternoRepository;
import com.oficinazony.motomanager.repository.OsPecaEstoqueRepository;
import com.oficinazony.motomanager.repository.VendaItemRepository;
import com.oficinazony.motomanager.repository.VendaRepository;
import com.oficinazony.motomanager.security.AuthContextService;
import com.oficinazony.motomanager.security.SecurityUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RelatorioService {

    private final VendaRepository vendaRepository;
    private final VendaItemRepository vendaItemRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final OsPecaEstoqueRepository osPecaEstoqueRepository;
    private final OsCustoExternoRepository osCustoExternoRepository;
    private final AuthContextService authContextService;

    public RelatorioService(
            VendaRepository vendaRepository,
            VendaItemRepository vendaItemRepository,
            OrdemServicoRepository ordemServicoRepository,
            OsPecaEstoqueRepository osPecaEstoqueRepository,
            OsCustoExternoRepository osCustoExternoRepository,
            AuthContextService authContextService
    ) {
        this.vendaRepository = vendaRepository;
        this.vendaItemRepository = vendaItemRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.osPecaEstoqueRepository = osPecaEstoqueRepository;
        this.osCustoExternoRepository = osCustoExternoRepository;
        this.authContextService = authContextService;
    }

    @Transactional(readOnly = true)
    public RelatorioResumoResponse resumo(LocalDate dataInicio, LocalDate dataFim, Integer oficinaIdFiltro) {
        SecurityUser current = authContextService.currentUser();

        List<Venda> vendas;
        List<OrdemServico> ordens;
        if (current.getRole() == UserRole.SUPERADMIN) {
            if (oficinaIdFiltro != null) {
                vendas = vendaRepository.findByOficinaId(oficinaIdFiltro);
                ordens = ordemServicoRepository.findByOficinaId(oficinaIdFiltro);
            } else {
                vendas = vendaRepository.findAll();
                ordens = ordemServicoRepository.findAll();
            }
        } else {
            if (oficinaIdFiltro != null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas SUPERADMIN pode filtrar por oficina");
            }
            vendas = current.getOficinaId() == null ? List.of() : vendaRepository.findByOficinaId(current.getOficinaId());
            ordens = current.getOficinaId() == null ? List.of() : ordemServicoRepository.findByOficinaId(current.getOficinaId());
        }

        if (dataInicio != null) {
            vendas = vendas.stream()
                    .filter(v -> !v.getDataVenda().toLocalDate().isBefore(dataInicio))
                    .toList();
            ordens = ordens.stream()
                    .filter(o -> !o.getDataAbertura().toLocalDate().isBefore(dataInicio))
                    .toList();
        }
        if (dataFim != null) {
            vendas = vendas.stream()
                    .filter(v -> !v.getDataVenda().toLocalDate().isAfter(dataFim))
                    .toList();
            ordens = ordens.stream()
                    .filter(o -> !o.getDataAbertura().toLocalDate().isAfter(dataFim))
                    .toList();
        }

        List<Integer> vendaIds = vendas.stream().map(Venda::getId).toList();
        List<Integer> osIds = ordens.stream().map(OrdemServico::getId).toList();

        List<VendaItem> vendaItens = vendaIds.isEmpty() ? List.of() : vendaItemRepository.findByVendaIdIn(vendaIds);
        List<OsPecaEstoque> osPecas = osIds.isEmpty() ? List.of() : osPecaEstoqueRepository.findByOrdemServicoIdIn(osIds);
        List<OsCustoExterno> osCustosExternos = osIds.isEmpty() ? List.of() : osCustoExternoRepository.findByOrdemServicoIdIn(osIds);

        BigDecimal receitaVendas = vendas.stream()
                .map(v -> v.getValorTotal() == null ? BigDecimal.ZERO : v.getValorTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoVendas = vendaItens.stream()
                .map(i -> i.getProduto().getPrecoCusto().multiply(BigDecimal.valueOf(i.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal lucroVendas = receitaVendas.subtract(custoVendas);

        BigDecimal receitaOs = ordens.stream()
                .map(o -> o.getValorTotal() == null ? BigDecimal.ZERO : o.getValorTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoOsPecas = osPecas.stream()
                .map(i -> i.getProduto().getPrecoCusto().multiply(BigDecimal.valueOf(i.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoOsExternos = osCustosExternos.stream()
                .map(OsCustoExterno::getCustoAquisicao)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoOsTotal = custoOsPecas.add(custoOsExternos);

        BigDecimal receitaTotal = receitaVendas.add(receitaOs);
        BigDecimal despesaTotal = custoVendas.add(custoOsTotal);
        BigDecimal resultado = receitaTotal.subtract(despesaTotal);

        long quantidadePecasVendidas = vendaItens.stream()
                .filter(i -> i.getProduto().getTipo().name().equals("PECA"))
                .mapToLong(VendaItem::getQuantidade)
                .sum();

        long quantidadeVendasPendentes = vendas.stream()
                .filter(v -> v.getStatus() == VendaStatus.PENDENTE)
                .count();
        long quantidadeOsAbertas = ordens.stream()
                .filter(o -> o.getStatus() == OrdemServicoStatus.ABERTA || o.getStatus() == OrdemServicoStatus.EM_EXECUCAO)
                .count();

        BigDecimal ticketMedioVendas = vendas.isEmpty()
                ? BigDecimal.ZERO
                : receitaVendas.divide(BigDecimal.valueOf(vendas.size()), 2, RoundingMode.HALF_UP);
        BigDecimal ticketMedioOs = ordens.isEmpty()
                ? BigDecimal.ZERO
                : receitaOs.divide(BigDecimal.valueOf(ordens.size()), 2, RoundingMode.HALF_UP);

        return new RelatorioResumoResponse(
                receitaTotal,
                despesaTotal,
                resultado,
                receitaVendas,
                custoVendas,
                lucroVendas,
                receitaOs,
                custoOsTotal,
                (long) vendas.size(),
                (long) ordens.size(),
                quantidadePecasVendidas,
                quantidadeVendasPendentes,
                quantidadeOsAbertas,
                ticketMedioVendas,
                ticketMedioOs
        );
    }
}
