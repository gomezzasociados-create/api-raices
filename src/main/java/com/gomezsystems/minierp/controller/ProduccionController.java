package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.*;
import com.gomezsystems.minierp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/produccion")
@CrossOrigin(origins = "*")
public class ProduccionController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private LoteRepository loteRepository;
    @Autowired private KardexRepository kardexRepository;
    @Autowired private CongeladorMayoristaRepository congeladorMayoristaRepository;
    @Autowired private StockCongeladorMayoristaRepository stockCongeladorMayoristaRepository;
    @Autowired private VentaRepository ventaRepository;

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

    // =========================================================================
    // CONGELADORES MAYORISTAS (CLIENTES CON PACKS DE PULPAS A PRECIO ESPECIAL)
    // =========================================================================

    @GetMapping("/mayoristas/{sucursal}")
    public List<Map<String, Object>> listarCongeladoresMayoristas(@PathVariable String sucursal) {
        List<CongeladorMayorista> lista = congeladorMayoristaRepository.findBySucursalOrderByIdDesc(sucursal);
        List<Map<String, Object>> resp = new ArrayList<>();
        for (CongeladorMayorista c : lista) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("sucursal", c.getSucursal());
            item.put("nombreCliente", c.getNombreCliente());
            item.put("nombreCongelador", c.getNombreCongelador());
            item.put("contacto", c.getContacto());
            item.put("notas", c.getNotas());
            item.put("fechaCreacion", c.getFechaCreacion());
            item.put("stocks", stockCongeladorMayoristaRepository.findByIdCongeladorOrderByNombreProductoAsc(c.getId()));
            resp.add(item);
        }
        return resp;
    }

    @PostMapping("/mayoristas")
    public ResponseEntity<?> crearCongeladorMayorista(@RequestBody Map<String, Object> body) {
        String nombreCliente = body.get("nombreCliente") != null ? body.get("nombreCliente").toString().trim() : "";
        if (nombreCliente.isEmpty()) return ResponseEntity.badRequest().body("Ingresa el nombre del cliente mayorista.");

        CongeladorMayorista c = new CongeladorMayorista();
        c.setSucursal(body.get("sucursal") != null ? body.get("sucursal").toString().trim() : "Antofagasta");
        c.setNombreCliente(nombreCliente);
        String nomCong = body.get("nombreCongelador") != null ? body.get("nombreCongelador").toString().trim() : "";
        c.setNombreCongelador(nomCong.isEmpty() ? ("Congelador " + nombreCliente) : nomCong);
        c.setContacto(body.get("contacto") != null ? body.get("contacto").toString().trim() : "");
        c.setNotas(body.get("notas") != null ? body.get("notas").toString().trim() : "");
        c.setFechaCreacion(LocalDateTime.now(ZoneId.of("America/Santiago")));
        return ResponseEntity.ok(congeladorMayoristaRepository.save(c));
    }

    @DeleteMapping("/mayoristas/{id}")
    @Transactional
    public ResponseEntity<String> eliminarCongeladorMayorista(@PathVariable Long id) {
        stockCongeladorMayoristaRepository.deleteByIdCongelador(id);
        congeladorMayoristaRepository.deleteById(id);
        return ResponseEntity.ok("Congelador mayorista eliminado.");
    }

    @PostMapping("/mayoristas/{idCongelador}/cargar")
    @Transactional
    public ResponseEntity<?> cargarPackEnCongelador(@PathVariable Long idCongelador, @RequestBody Map<String, Object> body) {
        Optional<CongeladorMayorista> congOpt = congeladorMayoristaRepository.findById(idCongelador);
        if (congOpt.isEmpty()) return ResponseEntity.badRequest().body("Congelador mayorista no encontrado.");
        CongeladorMayorista cong = congOpt.get();

        Long idProducto = Long.valueOf(body.get("idProducto").toString());
        int cantidad = Integer.parseInt(body.get("cantidad").toString());
        double precioMayorista = Double.parseDouble(body.get("precioMayorista").toString());
        boolean fabricarDesdeBodega = body.get("fabricarDesdeBodega") != null && Boolean.parseBoolean(body.get("fabricarDesdeBodega").toString());

        if (cantidad <= 0) return ResponseEntity.badRequest().body("La cantidad debe ser mayor a 0.");

        Optional<Producto> prodOpt = productoRepository.findById(idProducto);
        if (prodOpt.isEmpty()) return ResponseEntity.badRequest().body("Producto no encontrado.");
        Producto prod = prodOpt.get();

        if (fabricarDesdeBodega && prod.getRecetaDetalle() != null && !prod.getRecetaDetalle().trim().isEmpty()) {
            descontarMateriaPrimaPorReceta(prod, cantidad, "Congelador Mayorista: " + cong.getNombreCliente());
        }

        StockCongeladorMayorista stock = stockCongeladorMayoristaRepository
                .findByIdCongeladorAndIdProducto(idCongelador, idProducto)
                .orElseGet(StockCongeladorMayorista::new);
        stock.setIdCongelador(idCongelador);
        stock.setIdProducto(idProducto);
        stock.setNombreProducto(prod.getNombre());
        stock.setStockPacks((stock.getStockPacks() != null ? stock.getStockPacks() : 0) + cantidad);
        stock.setPrecioMayorista(precioMayorista);

        LocalDate hoy = LocalDate.now(ZoneId.of("America/Santiago"));
        stock.setFechaElaboracion(hoy);
        stock.setFechaVencimiento(hoy.plusDays(30));

        return ResponseEntity.ok(stockCongeladorMayoristaRepository.save(stock));
    }

    @PostMapping("/mayoristas/{idCongelador}/vender")
    @Transactional
    public ResponseEntity<?> venderDesdeCongeladorMayorista(@PathVariable Long idCongelador, @RequestBody Map<String, Object> body) {
        Optional<CongeladorMayorista> congOpt = congeladorMayoristaRepository.findById(idCongelador);
        if (congOpt.isEmpty()) return ResponseEntity.badRequest().body("Congelador mayorista no encontrado.");
        CongeladorMayorista cong = congOpt.get();

        Long idStock = Long.valueOf(body.get("idStock").toString());
        int cantidad = Integer.parseInt(body.get("cantidad").toString());
        String medioPago = body.get("medioPago") != null ? body.get("medioPago").toString().trim() : "Transferencia";

        Optional<StockCongeladorMayorista> stockOpt = stockCongeladorMayoristaRepository.findById(idStock);
        if (stockOpt.isEmpty()) return ResponseEntity.badRequest().body("Pack no encontrado en el congelador.");
        StockCongeladorMayorista stock = stockOpt.get();

        int actual = stock.getStockPacks() != null ? stock.getStockPacks() : 0;
        if (cantidad <= 0 || cantidad > actual) {
            return ResponseEntity.badRequest().body("Stock insuficiente en este congelador mayorista (disponible: " + actual + ").");
        }

        double precioUnit = body.get("precioUnitario") != null
                ? Double.parseDouble(body.get("precioUnitario").toString())
                : (stock.getPrecioMayorista() != null ? stock.getPrecioMayorista() : 0.0);
        double totalVenta = Math.round(precioUnit * cantidad);

        stock.setStockPacks(actual - cantidad);
        stockCongeladorMayoristaRepository.save(stock);

        // Registrar venta pagada automáticamente en Tesorería
        Venta venta = new Venta();
        venta.setPais(cong.getSucursal() != null ? cong.getSucursal() : "Antofagasta");
        venta.setFecha(LocalDateTime.now(ZoneId.of("America/Santiago")));
        venta.setOrigen("MAYORISTA (" + cong.getNombreCongelador() + ")");
        venta.setNombreCliente(cong.getNombreCliente());
        venta.setMedioPago(medioPago);
        venta.setEstado("Pagado");
        venta.setArchivada(false);
        venta.setTotal(totalVenta);

        if (stock.getIdProducto() != null) {
            productoRepository.findById(stock.getIdProducto()).ifPresent(prod -> {
                DetalleVenta dv = new DetalleVenta();
                dv.setProducto(prod);
                dv.setCantidad(cantidad);
                dv.setSubtotal(totalVenta);
                venta.addDetalle(dv);
            });
        }
        Venta guardada = ventaRepository.save(venta);

        MovimientoKardex mk = new MovimientoKardex();
        mk.setNombreInsumo(stock.getNombreProducto() + " [Mayorista: " + cong.getNombreCliente() + "]");
        mk.setCategoria("Congelador Mayorista");
        mk.setSucursal(cong.getSucursal());
        mk.setFechaHora(LocalDateTime.now(ZoneId.of("America/Santiago")));
        mk.setTipoMovimiento("Venta Mayorista -> Tesorería");
        mk.setVariacion((double) -cantidad);
        mk.setActor("Mayorista " + cong.getNombreCliente() + " (#" + guardada.getId() + ")");
        kardexRepository.save(mk);

        return ResponseEntity.ok(Map.of(
                "ventaId", guardada.getId(),
                "total", totalVenta,
                "stockRestante", stock.getStockPacks()
        ));
    }

    private void descontarMateriaPrimaPorReceta(Producto producto, int cantidadAProducir, String actorOrigen) {
        if (cantidadAProducir <= 0 || producto.getRecetaDetalle() == null || producto.getRecetaDetalle().trim().isEmpty()) return;
        String[] lineasIngredientes = producto.getRecetaDetalle().split("\\n");
        List<Insumo> insumosSucursal = insumoRepository.findBySucursal(producto.getSucursal());
        if (insumosSucursal == null || insumosSucursal.isEmpty()) insumosSucursal = insumoRepository.findAll();

        for (String nombreIngrediente : lineasIngredientes) {
            String[] partes = nombreIngrediente.split(":");
            if (partes.length < 2) continue;
            String nombreLimpio = partes[0].trim().toLowerCase();
            String unidadReceta = partes[1].toLowerCase();
            double gastoPorUnidad;
            try {
                gastoPorUnidad = Double.parseDouble(partes[1].replaceAll("[^0-9.]", "").trim());
            } catch (Exception e) { continue; }
            if (nombreLimpio.isEmpty() || gastoPorUnidad <= 0) continue;

            Insumo insMatch = null;
            if (partes.length >= 3 && !partes[2].trim().isEmpty()) {
                try {
                    insMatch = insumoRepository.findById(Long.valueOf(partes[2].trim())).orElse(null);
                } catch (Exception ignored) {}
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
                String medIns = insMatch.getMedida() != null ? insMatch.getMedida().toLowerCase() : "gr";
                if (unidadReceta.contains("porc") && ("gr".equals(medIns) || "mls".equals(medIns))) {
                    double dosis = (insMatch.getCantidadPorcion() != null && insMatch.getCantidadPorcion() > 0) ? insMatch.getCantidadPorcion() : 50.0;
                    totalADescontar = (gastoPorUnidad * dosis) * cantidadAProducir;
                }
                double stockPrev = insMatch.getUnidadActual() != null ? insMatch.getUnidadActual() : 0.0;
                insMatch.setUnidadActual(Math.max(0.0, stockPrev - totalADescontar));
                insumoRepository.save(insMatch);

                MovimientoKardex mk = new MovimientoKardex();
                mk.setNombreInsumo(insMatch.getNombre());
                mk.setCategoria(insMatch.getCategoria() != null ? insMatch.getCategoria() : "Materia Prima (Pulpas)");
                mk.setSucursal(insMatch.getSucursal());
                mk.setFechaHora(LocalDateTime.now(ZoneId.of("America/Santiago")));
                mk.setTipoMovimiento("Salida por " + actorOrigen);
                mk.setVariacion(-totalADescontar);
                mk.setActor(actorOrigen + " (" + producto.getNombre() + ")");
                kardexRepository.save(mk);
            }
        }
    }
}
