package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OrdemServico;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Integer> {
    List<OrdemServico> findByOficinaId(Integer oficinaId);

    List<OrdemServico> findByClienteRefIdOrderByDataAberturaDesc(Integer clienteId);

    boolean existsByClienteRefId(Integer clienteId);

    @Modifying
    @Query("update OrdemServico os set os.clienteRef = null where os.clienteRef.id = :clienteId")
    void desvincularCliente(@Param("clienteId") Integer clienteId);
}
