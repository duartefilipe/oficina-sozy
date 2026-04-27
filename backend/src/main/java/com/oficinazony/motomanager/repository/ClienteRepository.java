package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Cliente;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    List<Cliente> findByOficinaIdOrderByNomeAsc(Integer oficinaId);

    Optional<Cliente> findByOficinaIdAndNomeIgnoreCase(Integer oficinaId, String nome);
}
