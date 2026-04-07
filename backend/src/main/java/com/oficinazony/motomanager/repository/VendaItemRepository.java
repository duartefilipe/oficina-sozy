package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.VendaItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaItemRepository extends JpaRepository<VendaItem, Integer> {
    List<VendaItem> findByVendaId(Integer vendaId);
    List<VendaItem> findByVendaIdIn(List<Integer> vendaIds);
}
