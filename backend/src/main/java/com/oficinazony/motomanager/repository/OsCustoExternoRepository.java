package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsCustoExterno;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OsCustoExternoRepository extends JpaRepository<OsCustoExterno, Integer> {
    List<OsCustoExterno> findByOrdemServicoId(Integer ordemServicoId);
    List<OsCustoExterno> findByOrdemServicoIdIn(List<Integer> ordemServicoIds);
    void deleteByOrdemServicoId(Integer ordemServicoId);
}
