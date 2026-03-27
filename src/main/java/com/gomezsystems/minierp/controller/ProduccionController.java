package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/produccion")
@CrossOrigin(origins = "*")
public class ProduccionController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private InsumoRepository insumoRepository;

    @PostMapping("/fabricar")
    public ResponseEntity<String> fabricarLote(@RequestBody Map<String, Object> payload) {
        try {
            Long idProducto = Long.valueOf(payload.get("idProducto").toString());
            Integer cantidadAProducir = Integer.valueOf(payload.get("cantidad").toString());
            Optional<Producto> prodOpt = productoRepository.findById(idProducto);

            if (prodOpt.isPresent()) {
                Producto producto = prodOpt.get();

                if (producto.getRecetaDetalle() != null && !producto.getRecetaDetalle().trim().isEmpty()) {
                    String[] lineasIngredientes = producto.getRecetaDetalle().split("\\n");
                    // FILTRO INTELIGENTE: Solo trae insumos del mismo país del producto
                    List<Insumo> insumosSucursal = insumoRepository.findBySucursal(producto.getSucursal());

                    for (String nombreIngrediente : lineasIngredientes) {
                        String[] partes = nombreIngrediente.split(":");
                        String nombreLimpio = partes[0].trim().toLowerCase();
                        if (nombreLimpio.isEmpty()) continue;

                        double gastoPorUnidad = 1.0;
                        if(partes.length > 1) {
                            try { gastoPorUnidad = Double.parseDouble(partes[1].trim()); } catch(Exception e) {}
                        }

                        for (Insumo ins : insumosSucursal) {
                            if (ins.getNombre().toLowerCase().trim().equals(nombreLimpio)) {
                                ins.setUnidadActual((int) (ins.getUnidadActual() - (gastoPorUnidad * cantidadAProducir)));
                                insumoRepository.save(ins);
                                break;
                            }
                        }
                    }
                }
                Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
                producto.setStock(stockActual + cantidadAProducir);
                productoRepository.save(producto);
                return ResponseEntity.ok("Producción registrada en bodega local.");
            }
            return ResponseEntity.badRequest().body("Producto no encontrado.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}