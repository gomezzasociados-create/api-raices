package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.PagoTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PagoTrabajadorRepository extends JpaRepository<PagoTrabajador, Long> {
    List<PagoTrabajador> findBySucursalOrderByFechaPagoDesc(String sucursal);
}
