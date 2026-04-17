package com.gomezsystems.minierp.service;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.MovimientoKardex;
import com.gomezsystems.minierp.model.Receta;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.KardexRepository;
import com.gomezsystems.minierp.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventarioService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private RecetaRepository recetaRepository;

    @Autowired
    private KardexRepository kardexRepository;

    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida, String actorCausa) {

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
                int cantidadIntDesc = (int) totalADescontar;
                int nuevoStock = insumo.getUnidadActual() - cantidadIntDesc;

                if (nuevoStock < 0) {
                    System.out.println("¡ALERTA ROJA! El insumo " + insumo.getNombre() + " quedó en negativo.");
                }

                insumo.setUnidadActual(nuevoStock);
                insumoRepository.save(insumo);

                // --- NUEVO: KARDEX SYNC ---
                MovimientoKardex mk = new MovimientoKardex();
                mk.setNombreInsumo(insumo.getNombre());
                mk.setCategoria(insumo.getCategoria() != null ? insumo.getCategoria() : "Insumo Produccion");
                mk.setSucursal(insumo.getSucursal());
                mk.setFechaHora(LocalDateTime.now());
                mk.setTipoMovimiento("Salida por Venta");
                mk.setVariacion(-cantidadIntDesc);
                mk.setActor(actorCausa != null ? actorCausa : "Motor de Ventas Automatizado");
                kardexRepository.save(mk);

            } else {
                System.out.println("Error: No se encontró el insumo con ID " + receta.getIdInsumo());
            }
        }
    }

    // Sobrecarga por si se llama desde el inventariocontroller viejo
    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida) {
        procesarVenta(idProductoVendido, cantidadVendida, "Ajuste Directo REST");
    }
}