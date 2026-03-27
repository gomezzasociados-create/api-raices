package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // ¡EL FILTRO INTELIGENTE!
    // Esto le permitirá a Java pedir solo el menú de Antofagasta sin mezclarlo con Tuluá
    List<Producto> findBySucursal(String sucursal);

}