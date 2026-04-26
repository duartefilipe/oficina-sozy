package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Oficina;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OficinaRepository extends JpaRepository<Oficina, Integer> {
    Optional<Oficina> findByNomeIgnoreCase(String nome);
}
