package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.StockCongeladorMayorista;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StockCongeladorMayoristaRepository extends JpaRepository<StockCongeladorMayorista, Long> {
    List<StockCongeladorMayorista> findByIdCongeladorOrderByNombreProductoAsc(Long idCongelador);
    Optional<StockCongeladorMayorista> findByIdCongeladorAndIdProducto(Long idCongelador, Long idProducto);
    void deleteByIdCongelador(Long idCongelador);
}
