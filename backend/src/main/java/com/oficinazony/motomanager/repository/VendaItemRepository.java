package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.VendaItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendaItemRepository extends JpaRepository<VendaItem, Integer> {
    List<VendaItem> findByVendaId(Integer vendaId);
    List<VendaItem> findByVendaIdIn(List<Integer> vendaIds);
    void deleteByVendaId(Integer vendaId);
    void deleteByVendaIdIn(List<Integer> vendaIds);

    @Modifying
    @Query("delete from VendaItem vi where vi.venda.oficina.id = :oficinaId")
    void deleteByOficinaId(@Param("oficinaId") Integer oficinaId);
}
