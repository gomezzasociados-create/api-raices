package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.LoteProduccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoteRepository extends JpaRepository<LoteProduccion, Long> {
    List<LoteProduccion> findBySucursal(String sucursal);
    Optional<LoteProduccion> findByIdProducto(Long idProducto);
}
