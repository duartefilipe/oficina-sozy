package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Venda;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendaRepository extends JpaRepository<Venda, Integer> {
    List<Venda> findByOficinaId(Integer oficinaId);

    List<Venda> findByClienteRefIdOrderByDataVendaDesc(Integer clienteId);
}
