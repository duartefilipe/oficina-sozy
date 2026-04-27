package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsCustoExterno;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OsCustoExternoRepository extends JpaRepository<OsCustoExterno, Integer> {
    List<OsCustoExterno> findByOrdemServicoId(Integer ordemServicoId);
    List<OsCustoExterno> findByOrdemServicoIdIn(List<Integer> ordemServicoIds);
    void deleteByOrdemServicoId(Integer ordemServicoId);
    void deleteByOrdemServicoIdIn(List<Integer> ordemServicoIds);

    @Modifying
    @Query("delete from OsCustoExterno c where c.ordemServico.oficina.id = :oficinaId")
    void deleteByOficinaId(@Param("oficinaId") Integer oficinaId);
}
