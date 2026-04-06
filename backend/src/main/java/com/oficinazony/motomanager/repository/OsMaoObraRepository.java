package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsMaoObra;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OsMaoObraRepository extends JpaRepository<OsMaoObra, Integer> {
    List<OsMaoObra> findByOrdemServicoId(Integer ordemServicoId);
}
