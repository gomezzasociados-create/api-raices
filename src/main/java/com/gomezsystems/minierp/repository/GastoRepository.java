package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {
    
    List<Gasto> findBySucursal(String sucursal);

    @Query("SELECT COALESCE(SUM(g.monto), 0.0) FROM Gasto g WHERE g.sucursal = :sucursal AND g.archivada = false")
    Double sumGastosActivosBySucursal(@Param("sucursal") String sucursal);

    @Modifying
    @Transactional
    @Query("UPDATE Gasto g SET g.archivada = true WHERE g.sucursal = :sucursal AND g.archivada = false")
    void archivarGastosPorSucursal(@Param("sucursal") String sucursal);
}
