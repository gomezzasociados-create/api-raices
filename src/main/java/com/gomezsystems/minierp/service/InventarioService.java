package com.gomezsystems.minierp.service;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.Receta;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InventarioService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private RecetaRepository recetaRepository;

    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida) {

        List<Receta> ingredientes = recetaRepository.findByIdProducto(idProductoVendido);

        if (ingredientes.isEmpty()) {
            System.out.println("Aviso: El producto con ID " + idProductoVendido + " no tiene receta registrada.");
            return;
        }

        for (Receta receta : ingredientes) {

            Optional<Insumo> insumoOpt = insumoRepository.findById(receta.getIdInsumo());

            if (insumoOpt.isPresent()) {
                Insumo insumo = insumoOpt.get();

                double totalADescontar = receta.getCantidadNecesaria() * cantidadVendida;

                // AQUÍ ESTÁ LA MAGIA: Usamos getUnidadActual() y lo convertimos a entero (int)
                int nuevoStock = (int) (insumo.getUnidadActual() - totalADescontar);

                if (nuevoStock < 0) {
                    System.out.println("¡ALERTA ROJA! El insumo " + insumo.getNombre() + " quedó en negativo.");
                }

                // Y aquí usamos setUnidadActual()
                insumo.setUnidadActual(nuevoStock);

                insumoRepository.save(insumo);

            } else {
                System.out.println("Error: No se encontró el insumo con ID " + receta.getIdInsumo());
            }
        }
    }
}