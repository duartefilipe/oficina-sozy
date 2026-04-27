package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.OsMaoObra;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OsMaoObraRepository extends JpaRepository<OsMaoObra, Integer> {
    List<OsMaoObra> findByOrdemServicoId(Integer ordemServicoId);
    void deleteByOrdemServicoId(Integer ordemServicoId);
    void deleteByOrdemServicoIdIn(List<Integer> ordemServicoIds);

    @Modifying
    @Query("delete from OsMaoObra m where m.ordemServico.oficina.id = :oficinaId")
    void deleteByOficinaId(@Param("oficinaId") Integer oficinaId);
}
