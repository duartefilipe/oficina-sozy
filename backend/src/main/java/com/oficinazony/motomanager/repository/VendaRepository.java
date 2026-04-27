package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Venda;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendaRepository extends JpaRepository<Venda, Integer> {
    List<Venda> findByOficinaId(Integer oficinaId);

    List<Venda> findByClienteRefIdOrderByDataVendaDesc(Integer clienteId);

    @Modifying
    @Query("update Venda v set v.clienteRef = null where v.clienteRef.id = :clienteId")
    void desvincularCliente(@Param("clienteId") Integer clienteId);

    boolean existsByClienteRefId(Integer clienteId);

    void deleteByOficinaId(Integer oficinaId);
}
