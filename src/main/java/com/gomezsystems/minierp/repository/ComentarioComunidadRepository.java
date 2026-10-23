package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.ComentarioComunidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioComunidadRepository extends JpaRepository<ComentarioComunidad, Long> {
    List<ComentarioComunidad> findByActivoTrueOrderByFechaDesc();
    List<ComentarioComunidad> findByArticuloIdAndActivoTrueOrderByFechaDesc(Long articuloId);
}
