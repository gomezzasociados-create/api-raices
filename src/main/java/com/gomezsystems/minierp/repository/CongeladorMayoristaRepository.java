package com.gomezsystems.minierp.repository;

import com.gomezsystems.minierp.model.CongeladorMayorista;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CongeladorMayoristaRepository extends JpaRepository<CongeladorMayorista, Long> {
    List<CongeladorMayorista> findBySucursalOrderByIdDesc(String sucursal);
}
