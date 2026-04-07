package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsPecaEstoque;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OsPecaEstoqueRepository extends JpaRepository<OsPecaEstoque, Integer> {
    List<OsPecaEstoque> findByOrdemServicoId(Integer ordemServicoId);
    List<OsPecaEstoque> findByOrdemServicoIdIn(List<Integer> ordemServicoIds);
    void deleteByOrdemServicoId(Integer ordemServicoId);
}
