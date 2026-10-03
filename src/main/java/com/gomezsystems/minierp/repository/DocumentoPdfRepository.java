package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.DocumentoPdf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface DocumentoPdfRepository extends JpaRepository<DocumentoPdf, Long> {

    @Query("SELECT d.id as id, d.nombre as nombre, d.categoria as categoria, d.sucursal as sucursal, d.fechaSubida as fechaSubida, d.tipoContenido as tipoContenido, d.tamanoBytes as tamanoBytes FROM DocumentoPdf d ORDER BY d.fechaSubida DESC")
    List<Map<String, Object>> listarCabeceras();

    @Query("SELECT d.id as id, d.nombre as nombre, d.categoria as categoria, d.sucursal as sucursal, d.fechaSubida as fechaSubida, d.tipoContenido as tipoContenido, d.tamanoBytes as tamanoBytes FROM DocumentoPdf d WHERE d.sucursal = :sucursal ORDER BY d.fechaSubida DESC")
    List<Map<String, Object>> listarCabecerasPorSucursal(@Param("sucursal") String sucursal);
}
