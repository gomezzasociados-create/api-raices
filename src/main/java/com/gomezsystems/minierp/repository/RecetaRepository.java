package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.Receta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecetaRepository extends JpaRepository<Receta, Long> {

    // Esta magia de Spring Boot buscará todos los ingredientes que lleva un batido
    List<Receta> findByIdProducto(Long idProducto);
}