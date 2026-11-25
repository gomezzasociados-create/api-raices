package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.MovimientoKardex;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.KardexRepository;
import com.gomezsystems.minierp.repository.LoteRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/produccion")
@CrossOrigin(origins = "*")
public class ProduccionController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private LoteRepository loteRepository;
    @Autowired private KardexRepository kardexRepository;

    @PostMapping("/fabricar")
    public ResponseEntity<String> fabricarLote(@RequestBody Map<String, Object> payload) {
        try {
            Long idProducto = Long.valueOf(payload.get("idProducto").toString());
            Integer cantidadAProducir = Integer.valueOf(payload.get("cantidad").toString());
            Optional<Producto> prodOpt = productoRepository.findById(idProducto);

            if (prodOpt.isPresent()) {
                Producto producto = prodOpt.get();

                if (cantidadAProducir > 0 && producto.getRecetaDetalle() != null && !producto.getRecetaDetalle().trim().isEmpty()) {
                    String[] lineasIngredientes = producto.getRecetaDetalle().split("\\n");
                    // FILTRO INTELIGENTE: Solo trae insumos de la sucursal del producto
                    List<Insumo> insumosSucursal = insumoRepository.findBySucursal(producto.getSucursal());
                    if (insumosSucursal == null || insumosSucursal.isEmpty()) {
                        insumosSucursal = insumoRepository.findAll();
                    }

                    for (String nombreIngrediente : lineasIngredientes) {
                        String[] partes = nombreIngrediente.split(":");
                        if (partes.length < 2) continue;
                        
                        String nombreLimpio = partes[0].trim().toLowerCase();
                        double gastoPorUnidad = 0.0;
                        String unidadReceta = partes[1].toLowerCase();
                        try { 
                            String cantClean = partes[1].replaceAll("[^0-9.]", "").trim();
                            gastoPorUnidad = Double.parseDouble(cantClean); 
                        } catch(Exception e) { continue; }

                        if (nombreLimpio.isEmpty() || gastoPorUnidad <= 0) continue;

                        Insumo insMatch = null;
                        if (partes.length >= 3 && !partes[2].trim().isEmpty()) {
                            try {
                                Long idIns = Long.valueOf(partes[2].trim());
                                insMatch = insumoRepository.findById(idIns).orElse(null);
                            } catch (Exception ignored) {}
                        }
                        if (insMatch == null) {
                            // Priorizar Bodega de Pulpas / Materia Prima para Génesis Producción
                            for (Insumo ins : insumosSucursal) {
                                String catIns = ins.getCategoria() != null ? ins.getCategoria().toLowerCase() : "";
                                boolean esBodegaPulpas = catIns.contains("pulpa") || (!catIns.contains("arma") && !catIns.contains("porci") && !catIns.contains("vaso") && !catIns.contains("packaging") && !catIns.contains("shot") && !catIns.contains("caldo") && !catIns.contains("exot"));
                                String insNombre = ins.getNombre() != null ? ins.getNombre().toLowerCase().trim() : "";
                                if (esBodegaPulpas && (insNombre.equals(nombreLimpio) || insNombre.contains(nombreLimpio) || nombreLimpio.contains(insNombre))) {
                                    insMatch = ins;
                                    break;
                                }
                            }
                        }
                        if (insMatch == null) {
                            for (Insumo ins : insumosSucursal) {
                                String insNombre = ins.getNombre() != null ? ins.getNombre().toLowerCase().trim() : "";
                                if (insNombre.equals(nombreLimpio) || insNombre.contains(nombreLimpio) || nombreLimpio.contains(insNombre)) {
                                    insMatch = ins;
                                    break;
                                }
                            }
                        }

                        if (insMatch != null) {
                            double totalADescontar = gastoPorUnidad * cantidadAProducir;
                            // Si la fórmula especificó porciones ("porc") y el insumo está en gr/mls, convertir a masa/volumen real
                            String medIns = insMatch.getMedida() != null ? insMatch.getMedida().toLowerCase() : "gr";
                            if (unidadReceta.contains("porc") && ("gr".equals(medIns) || "mls".equals(medIns))) {
                                double dosis = (insMatch.getCantidadPorcion() != null && insMatch.getCantidadPorcion() > 0) ? insMatch.getCantidadPorcion() : 50.0;
                                totalADescontar = (gastoPorUnidad * dosis) * cantidadAProducir;
                            }
                            double stockPrev = insMatch.getUnidadActual() != null ? insMatch.getUnidadActual() : 0.0;
                            insMatch.setUnidadActual(Math.max(0.0, stockPrev - totalADescontar));
                            insumoRepository.save(insMatch);

                            // Registrar en Kardex la salida de pulpas / materia prima en Génesis Producción
                            MovimientoKardex mk = new MovimientoKardex();
                            mk.setNombreInsumo(insMatch.getNombre());
                            mk.setCategoria(insMatch.getCategoria() != null ? insMatch.getCategoria() : "Materia Prima (Pulpas)");
                            mk.setSucursal(insMatch.getSucursal());
                            mk.setFechaHora(LocalDateTime.now());
                            mk.setTipoMovimiento("Salida por Génesis Producción");
                            mk.setVariacion(-totalADescontar);
                            mk.setActor("Génesis Producción (" + producto.getNombre() + ")");
                            kardexRepository.save(mk);
                        }
                    }
                }
                Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
                producto.setStock(stockActual + cantidadAProducir);
                productoRepository.save(producto);

                // --- Persistencia del Lote (Fechas) ---
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
