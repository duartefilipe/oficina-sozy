package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Cliente;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    List<Cliente> findByOficinaIdOrderByNomeAsc(Integer oficinaId);

    @Query("""
            select c
            from Cliente c
            where c.oficina.id = :oficinaId
              and lower(c.nome) = lower(:nome)
              and lower(coalesce(c.sobrenome, '')) = lower(:sobrenome)
            """)
    Optional<Cliente> findDuplicadoPorNomeCompleto(
            @Param("oficinaId") Integer oficinaId,
            @Param("nome") String nome,
            @Param("sobrenome") String sobrenome
    );
}
