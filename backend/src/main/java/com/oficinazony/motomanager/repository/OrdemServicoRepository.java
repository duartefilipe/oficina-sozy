package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OrdemServico;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Integer> {
    List<OrdemServico> findByOficinaId(Integer oficinaId);

    List<OrdemServico> findByClienteRefIdOrderByDataAberturaDesc(Integer clienteId);
}
