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

    @Autowired
    private com.gomezsystems.minierp.repository.ProductoRepository productoRepository;

    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida, String actorCausa) {

        List<Receta> ingredientes = recetaRepository.findByIdProducto(idProductoVendido);

        if (ingredientes.isEmpty()) {
            // FALLBACK: Intentar leer desde recetaDetalle del Producto
            Optional<com.gomezsystems.minierp.model.Producto> prodOpt = productoRepository.findById(idProductoVendido);
            
            if (prodOpt.isPresent()) {
                com.gomezsystems.minierp.model.Producto producto = prodOpt.get();
                
                if (producto.getRecetaDetalle() != null && !producto.getRecetaDetalle().trim().isEmpty()) {
                    String[] lineas = producto.getRecetaDetalle().split("\\n");
                    List<Insumo> insumosSucursal = insumoRepository.findBySucursal(producto.getSucursal());
                    
                    for (String linea : lineas) {
                        String[] partes = linea.split(":");
                        if (partes.length < 2) continue;
                        
                        String nombreLimpio = partes[0].trim().toLowerCase();
                        double gasto = 0;
                        try { 
                            gasto = Double.parseDouble(partes[1].trim()); 
                        } catch(Exception e) { 
                            continue; 
                        }
                        
                        for (Insumo ins : insumosSucursal) {
                            String insNombre = ins.getNombre().toLowerCase().trim();
                            if (insNombre.equals(nombreLimpio) || insNombre.contains(nombreLimpio) || nombreLimpio.contains(insNombre)) {
                                descontarInsumo(ins, gasto * cantidadVendida, actorCausa);
                                break;
                            }
                        }
                    }
                } else {
                    System.out.println("Aviso: El producto con ID " + idProductoVendido + " no tiene receta registrada en detalle.");
                }
            } else {
                System.out.println("Aviso: El producto con ID " + idProductoVendido + " no existe.");
            }
            return;
        }

        for (Receta receta : ingredientes) {
            Optional<Insumo> insumoOpt = insumoRepository.findById(receta.getIdInsumo());
            if (insumoOpt.isPresent()) {
                descontarInsumo(insumoOpt.get(), receta.getCantidadNecesaria() * cantidadVendida, actorCausa);
            } else {
                System.out.println("Error: No se encontró el insumo con ID " + receta.getIdInsumo());
            }
        }
    }

    private void descontarInsumo(Insumo insumo, double totalADescontar, String actorCausa) {
        double nuevoStock = insumo.getUnidadActual() - totalADescontar;
        if (nuevoStock < 0) {
            System.out.println("¡ALERTA ROJA! El insumo " + insumo.getNombre() + " quedó en negativo.");
        }
        insumo.setUnidadActual(nuevoStock);
        insumoRepository.save(insumo);

        MovimientoKardex mk = new MovimientoKardex();
        mk.setNombreInsumo(insumo.getNombre());
        mk.setCategoria(insumo.getCategoria() != null ? insumo.getCategoria() : "Insumo Produccion");
        mk.setSucursal(insumo.getSucursal());
        mk.setFechaHora(LocalDateTime.now());
        mk.setTipoMovimiento("Salida por Venta");
        mk.setVariacion(-totalADescontar);
        mk.setActor(actorCausa != null ? actorCausa : "Motor de Ventas Automatizado");
        kardexRepository.save(mk);
    }

    // Sobrecarga por si se llama desde el inventariocontroller viejo
    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida) {
        procesarVenta(idProductoVendido, cantidadVendida, "Ajuste Directo REST");
    }
}