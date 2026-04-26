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
    @Autowired private com.gomezsystems.minierp.repository.LoteRepository loteRepository;

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
                        if (partes.length < 2) continue;
                        
                        String nombreLimpio = partes[0].trim().toLowerCase();
                        double gastoPorUnidad = 0.0;
                        try { gastoPorUnidad = Double.parseDouble(partes[1].trim()); } catch(Exception e) { continue; }

                        if (nombreLimpio.isEmpty()) continue;

                        for (Insumo ins : insumosSucursal) {
                            String insNombre = ins.getNombre().toLowerCase().trim();
                            if (insNombre.equals(nombreLimpio) || insNombre.contains(nombreLimpio) || nombreLimpio.contains(insNombre)) {
                                double totalADescontar = gastoPorUnidad * cantidadAProducir;
                                ins.setUnidadActual(ins.getUnidadActual() - totalADescontar);
                                insumoRepository.save(ins);
                                break;
                            }
                        }
                    }
                }
                Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
                producto.setStock(stockActual + cantidadAProducir);
                productoRepository.save(producto);

                // --- NUEVO: Persistencia del Lote (Fechas) ---
                if (payload.containsKey("elaboracion") && payload.containsKey("vencimiento")) {
                    String elab = payload.get("elaboracion").toString();
                    String venc = payload.get("vencimiento").toString();
                    Integer vida = Integer.valueOf(payload.get("vidaTotalDias").toString());

                    com.gomezsystems.minierp.model.LoteProduccion lote = loteRepository.findByIdProducto(idProducto)
                            .orElse(new com.gomezsystems.minierp.model.LoteProduccion());

                    lote.setIdProducto(idProducto);
                    lote.setFechaElaboracion(java.time.LocalDate.parse(elab));
                    lote.setFechaVencimiento(java.time.LocalDate.parse(venc));
                    lote.setVidaTotalDias(vida);
                    lote.setSucursal(producto.getSucursal());
                    loteRepository.save(lote);
                }

                return ResponseEntity.ok("Producción registrada en bodega local.");
            }
            return ResponseEntity.badRequest().body("Producto no encontrado.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/lotes/{sucursal}")
    public List<com.gomezsystems.minierp.model.LoteProduccion> listarLotes(@PathVariable String sucursal) {
        return loteRepository.findBySucursal(sucursal);
    }

    @PostMapping("/lotes/migrar")
    public ResponseEntity<String> migrarLotes(@RequestBody List<Map<String, Object>> lotes) {
        try {
            for (Map<String, Object> l : lotes) {
                Long idProd = Long.valueOf(l.get("idProducto").toString());
                String elab = l.get("elaboracion").toString();
                String venc = l.get("vencimiento").toString();
                Integer vida = Integer.valueOf(l.get("vidaTotalDias").toString());
                String suc = l.get("sucursal").toString();

                com.gomezsystems.minierp.model.LoteProduccion lote = loteRepository.findByIdProducto(idProd)
                        .orElse(new com.gomezsystems.minierp.model.LoteProduccion());

                lote.setIdProducto(idProd);
                lote.setFechaElaboracion(java.time.LocalDate.parse(elab));
                lote.setFechaVencimiento(java.time.LocalDate.parse(venc));
                lote.setVidaTotalDias(vida);
                lote.setSucursal(suc);
                loteRepository.save(lote);
            }
            return ResponseEntity.ok("Migración completada con éxito.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error en migración: " + e.getMessage());
        }
    }

    @DeleteMapping("/lotes/{idProducto}")
    public ResponseEntity<String> resetearLote(@PathVariable Long idProducto) {
        loteRepository.findByIdProducto(idProducto).ifPresent(loteRepository::delete);
        return ResponseEntity.ok("Lote reseteado.");
    }
}