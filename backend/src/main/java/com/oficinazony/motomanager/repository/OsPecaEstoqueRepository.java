package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsPecaEstoque;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OsPecaEstoqueRepository extends JpaRepository<OsPecaEstoque, Integer> {
    List<OsPecaEstoque> findByOrdemServicoId(Integer ordemServicoId);
    List<OsPecaEstoque> findByOrdemServicoIdIn(List<Integer> ordemServicoIds);
    void deleteByOrdemServicoId(Integer ordemServicoId);

    @Modifying
    @Query("delete from OsPecaEstoque p where p.ordemServico.oficina.id = :oficinaId")
    void deleteByOficinaId(@Param("oficinaId") Integer oficinaId);
}
