package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("SELECT COALESCE(SUM(v.total), 0.0) FROM Venta v WHERE v.pais = :sucursal AND v.archivada = false")
    Double sumTotalBySucursalActiva(@Param("sucursal") String sucursal);

    @Query("SELECT COALESCE(SUM(v.total), 0.0) FROM Venta v WHERE v.pais = :sucursal AND v.archivada = false AND v.medioPago = 'Efectivo'")
    Double sumTotalEfectivoBySucursalActiva(@Param("sucursal") String sucursal);

    @Query("SELECT COALESCE(SUM(v.total), 0.0) FROM Venta v WHERE v.pais = :sucursal AND v.archivada = false AND v.medioPago != 'Efectivo'")
    Double sumTotalBancoBySucursalActiva(@Param("sucursal") String sucursal);

    @Modifying
    @Transactional
    @Query("UPDATE Venta v SET v.archivada = true WHERE v.pais = :sucursal AND v.archivada = false")
    void archivarVentasPorSucursal(@Param("sucursal") String sucursal);

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