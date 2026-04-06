package com.oficinazony.motomanager.repository;

import com.oficinazony.motomanager.domain.entity.Produto;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProdutoRepository extends JpaRepository<Produto, Integer> {
    Optional<Produto> findBySku(String sku);
}
