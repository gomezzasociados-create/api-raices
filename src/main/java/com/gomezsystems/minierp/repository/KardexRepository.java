package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.MovimientoKardex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KardexRepository extends JpaRepository<MovimientoKardex, Long> {
    List<MovimientoKardex> findBySucursalOrderByFechaHoraDesc(String sucursal);
}
