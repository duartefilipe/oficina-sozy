package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.VendaItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaItemRepository extends JpaRepository<VendaItem, Integer> {
}
