package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    // 1. ORDEN PARA BORRAR LOS HIJOS (Los batidos dentro del ticket)
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM detalles_venta", nativeQuery = true)
    void vaciarDetalles();

    // 2. ORDEN PARA BORRAR LOS PADRES (Los tickets generales)
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM ventas", nativeQuery = true)
    void vaciarVentas();
}