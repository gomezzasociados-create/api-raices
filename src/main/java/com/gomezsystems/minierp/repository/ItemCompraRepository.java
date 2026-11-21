package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.ItemCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemCompraRepository extends JpaRepository<ItemCompra, Long> {
    List<ItemCompra> findByActivoEnListaTrueOrderByBodegaAscNombreInsumoAsc();
    List<ItemCompra> findByRegistradoEnHistorialTrueOrderByFechaCompraDesc();
    List<ItemCompra> findByIdInsumoAndActivoEnListaTrue(Long idInsumo);
}
