package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, Long> {
    List<Insumo> findBySucursal(String sucursal); // Filtro Inteligente
}