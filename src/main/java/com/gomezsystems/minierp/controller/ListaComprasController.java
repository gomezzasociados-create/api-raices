package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.*;
import com.gomezsystems.minierp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/compras")
@CrossOrigin(origins = "*")
public class ListaComprasController {

    @Autowired private ItemCompraRepository itemCompraRepository;
    @Autowired private InsumoRepository insumoRepository;
    @Autowired private GastoRepository gastoRepository;
    @Autowired private KardexRepository kardexRepository;
    @Autowired private ProductoRepository productoRepository;

    private static final double UMBRAL_REPOSICION = 3.0;

    public static String clasificarNombreBodega(Insumo i) {
        String cat = (i.getCategoria() != null ? i.getCategoria() : "").toLowerCase();
        String sub = (i.getSubcategoria() != null ? i.getSubcategoria() : "").toLowerCase();
        String nom = (i.getNombre() != null ? i.getNombre() : "").toLowerCase();

        if (cat.contains("arma") || cat.contains("porcion")) {
            return "4. Bodega de Porciones: Arma tu Batido";
        } else if (cat.contains("exot") || cat.contains("exótico") || sub.contains("exot") || nom.contains("exot")) {
            return "5. Línea Exóticos";
        } else if (cat.contains("vaso") || cat.contains("packaging")) {
            return "2. Vasos y Packaging (500 mls)";
        } else if (cat.contains("shot") || cat.contains("caldo")) {
            return "3. Shots y Caldos de Hueso";
        } else {
            return "1. Materia Prima (Pulpas)";
        }
    }

    public static double calcularUnidadesEfectivas(Insumo i) {
        double stockTotal = i.getUnidadActual() != null ? Math.max(0.0, i.getUnidadActual()) : 0.0;
        String cat = (i.getCategoria() != null ? i.getCategoria() : "").toLowerCase();
        String sub = (i.getSubcategoria() != null ? i.getSubcategoria() : "").toLowerCase();
        String nom = (i.getNombre() != null ? i.getNombre() : "").toLowerCase();
        String med = (i.getMedida() != null ? i.getMedida() : "gr").toLowerCase();

        boolean isArma = cat.contains("arma") || cat.contains("porcion");
        boolean isExot = !isArma && (cat.contains("exot") || cat.contains("exótico") || sub.contains("exot") || nom.contains("exot"));
        boolean isVaso = !isArma && !isExot && (cat.contains("vaso") || cat.contains("packaging"));
        boolean esMasaVol = "gr".equals(med) || "mls".equals(med);

        double dosis = (i.getCantidadPorcion() != null && i.getCantidadPorcion() > 0)
                ? i.getCantidadPorcion()
                : ("und".equals(med) ? 1.0 : 50.0);

        if (isArma || isVaso || !esMasaVol) {
            return Math.floor(stockTotal);
        }
        // Si en Pulpas, Shots o Exóticos el usuario ingresó porciones directas (ej: 3 < dosis de 50gr)
        if (dosis > 1.0 && stockTotal > 0 && stockTotal < dosis) {
            return Math.floor(stockTotal);
        }
        return Math.floor(stockTotal / Math.max(1.0, dosis));
    }

    public static double obtenerPrecioKiloActual(Insumo i) {
        double pKilo = (i.getPrecioKilo() != null && i.getPrecioKilo() > 0) ? i.getPrecioKilo() : 0.0;
        if (pKilo > 0 && pKilo <= 100.0) pKilo *= 1000.0;
        if (pKilo > 0) return Math.round(pKilo);

        double pr = i.getPrecio() != null ? i.getPrecio() : 0.0;
        String cat = (i.getCategoria() != null ? i.getCategoria() : "").toLowerCase();
        boolean isArma = cat.contains("arma") || cat.contains("porcion");
        String med = (i.getMedida() != null ? i.getMedida() : "gr").toLowerCase();
        double dosis = (i.getCantidadPorcion() != null && i.getCantidadPorcion() > 0) ? i.getCantidadPorcion() : 30.0;

        if (isArma) {
            if ("gr".equals(med) || "mls".equals(med)) {
                return Math.round((pr * 1000.0) / Math.max(1.0, dosis));
            }
            return Math.round(pr / Math.max(1.0, dosis));
        } else {
            if (pr > 0 && pr <= 100.0) pr *= 1000.0;
            return Math.round(pr);
        }
    }

    public static double obtenerPrecioPorcionActual(Insumo i) {
        String cat = (i.getCategoria() != null ? i.getCategoria() : "").toLowerCase();
        boolean isArma = cat.contains("arma") || cat.contains("porcion");
        String med = (i.getMedida() != null ? i.getMedida() : "gr").toLowerCase();
        double dosis = (i.getCantidadPorcion() != null && i.getCantidadPorcion() > 0) ? i.getCantidadPorcion() : 30.0;
        double pKilo = obtenerPrecioKiloActual(i);

        if (isArma && i.getPrecio() != null && i.getPrecio() > 0) {
            return Math.round(i.getPrecio());
        }
        if ("gr".equals(med) || "mls".equals(med)) {
            return Math.round((pKilo / 1000.0) * dosis);
        }
        return Math.round(pKilo * dosis);
    }

    @Transactional
    public void sincronizarInsumosEnUmbralBajo() {
        List<Insumo> todosInsumos = insumoRepository.findAll();
        for (Insumo ins : todosInsumos) {
            if (ins.getIdInsumo() == null || ins.getNombre() == null || ins.getNombre().isBlank()) continue;
            double unidadesDisp = calcularUnidadesEfectivas(ins);
            List<ItemCompra> existentesActivos = itemCompraRepository.findByIdInsumoAndActivoEnListaTrue(ins.getIdInsumo());

            if (unidadesDisp <= UMBRAL_REPOSICION) {
                if (existentesActivos.isEmpty()) {
                    ItemCompra nuevo = crearItemDesdeInsumo(ins, unidadesDisp);
                    itemCompraRepository.save(nuevo);
                } else {
                    // Actualizar stock actual si sigue en estado PENDIENTE
                    for (ItemCompra item : existentesActivos) {
                        if ("PENDIENTE".equalsIgnoreCase(item.getEstado())) {
                            item.setStockActualUnidades(unidadesDisp);
                            item.setStockActualFisico(ins.getUnidadActual() != null ? ins.getUnidadActual() : 0.0);
                            item.setBodega(clasificarNombreBodega(ins));
                            item.setSubcategoria(ins.getSubcategoria());
                            item.setMedida(ins.getMedida() != null ? ins.getMedida() : "gr");
                            item.setCantidadPorcion(ins.getCantidadPorcion() != null ? ins.getCantidadPorcion() : 30.0);
                            itemCompraRepository.save(item);
                        }
                    }
                }
            } else {
                // Si el insumo ya fue reabastecido (> 3 unidades) desde la bodega directamente,
                // retiramos de la lista activa los que aún estaban PENDIENTE (salvo que hayan sido agregados manualmente)
                for (ItemCompra item : existentesActivos) {
                    if ("PENDIENTE".equalsIgnoreCase(item.getEstado()) && !Boolean.TRUE.equals(item.getAgregadoManual())) {
                        item.setActivoEnLista(false);
                        itemCompraRepository.save(item);
                    } else {
                        item.setStockActualUnidades(unidadesDisp);
                        item.setStockActualFisico(ins.getUnidadActual() != null ? ins.getUnidadActual() : 0.0);
                        itemCompraRepository.save(item);
                    }
                }
            }
        }
    }

    private ItemCompra crearItemDesdeInsumo(Insumo ins, double unidadesDisp) {
        ItemCompra item = new ItemCompra();
        item.setIdInsumo(ins.getIdInsumo());
        item.setNombreInsumo(ins.getNombre());
        item.setBodega(clasificarNombreBodega(ins));
        item.setCategoriaOriginal(ins.getCategoria());
        item.setSubcategoria(ins.getSubcategoria() != null ? ins.getSubcategoria() : "General");
        item.setSucursal(ins.getSucursal() != null ? ins.getSucursal() : "Antofagasta");
        String med = ins.getMedida() != null ? ins.getMedida().toLowerCase() : "gr";
        item.setMedida(med);
        double dosis = (ins.getCantidadPorcion() != null && ins.getCantidadPorcion() > 0) ? ins.getCantidadPorcion() : ("und".equals(med) ? 1.0 : 30.0);
        item.setCantidadPorcion(dosis);
        item.setStockActualUnidades(unidadesDisp);
        item.setStockActualFisico(ins.getUnidadActual() != null ? ins.getUnidadActual() : 0.0);

        double pKilo = obtenerPrecioKiloActual(ins);
        double pPorc = obtenerPrecioPorcionActual(ins);
        item.setPrecioKiloAnterior(pKilo);
        item.setPrecioKiloNuevo(pKilo);
        item.setPrecioPorcionAnterior(pPorc);
        item.setPrecioPorcionNuevo(pPorc);

        String cat = (ins.getCategoria() != null ? ins.getCategoria() : "").toLowerCase();
        boolean isVaso = cat.contains("vaso") || cat.contains("packaging");

        if ("gr".equals(med)) {
            item.setCantidadAComprar(1.0); // 1 Kilo por defecto
            item.setUnidadCompra("Kilos (1.000 gr)");
            item.setCostoTotalCompra(pKilo * 1.0);
        } else if ("mls".equals(med)) {
            item.setCantidadAComprar(1.0); // 1 Litro por defecto
            item.setUnidadCompra("Litros (1.000 mls)");
            item.setCostoTotalCompra(pKilo * 1.0);
        } else {
            double cantDefault = isVaso ? 50.0 : 10.0;
            item.setCantidadAComprar(cantDefault);
            item.setUnidadCompra("Unidades (und)");
            item.setCostoTotalCompra(pKilo * cantDefault);
        }

        item.setEstado("PENDIENTE");
        item.setActivoEnLista(true);
        item.setRegistradoEnHistorial(false);
        item.setFechaDeteccion(LocalDateTime.now(ZoneId.of("America/Santiago")));
        return item;
    }

    @GetMapping("/lista")
    @Transactional
    public Map<String, Object> obtenerListaCompras(@RequestParam(required = false, defaultValue = "Antofagasta") String sucursal) {
        sincronizarInsumosEnUmbralBajo();
        List<ItemCompra> activos = itemCompraRepository.findByActivoEnListaTrueOrderByBodegaAscNombreInsumoAsc();
        List<ItemCompra> historial = itemCompraRepository.findByRegistradoEnHistorialTrueOrderByFechaCompraDesc();

        long pendientesCount = activos.stream().filter(i -> "PENDIENTE".equalsIgnoreCase(i.getEstado())).count();
        long compradosEnListaCount = activos.stream().filter(i -> "COMPRADO".equalsIgnoreCase(i.getEstado())).count();
        double presupuestoPendiente = activos.stream()
                .filter(i -> "PENDIENTE".equalsIgnoreCase(i.getEstado()))
                .mapToDouble(i -> i.getCostoTotalCompra() != null ? i.getCostoTotalCompra() : 0.0)
                .sum();
        double totalGastadoHistorial = historial.stream()
                .filter(i -> "COMPRADO".equalsIgnoreCase(i.getEstado()))
                .mapToDouble(i -> i.getCostoTotalCompra() != null ? i.getCostoTotalCompra() : 0.0)
                .sum();

        Map<String, Object> resp = new HashMap<>();
        resp.put("activos", activos);
        resp.put("historial", historial);
        resp.put("pendientesCount", pendientesCount);
        resp.put("compradosEnListaCount", compradosEnListaCount);
        resp.put("presupuestoPendiente", Math.round(presupuestoPendiente));
        resp.put("totalGastadoHistorial", Math.round(totalGastadoHistorial));
        return resp;
    }

    @PostMapping("/agregar-manual/{idInsumo}")
    @Transactional
    public ResponseEntity<?> agregarManualALista(@PathVariable Long idInsumo) {
        Optional<Insumo> insOpt = insumoRepository.findById(idInsumo);
        if (insOpt.isEmpty()) return ResponseEntity.badRequest().body("Insumo no encontrado");
        Insumo ins = insOpt.get();
        List<ItemCompra> activos = itemCompraRepository.findByIdInsumoAndActivoEnListaTrue(idInsumo);
        if (!activos.isEmpty()) {
            return ResponseEntity.ok(activos.get(0));
        }
        ItemCompra nuevo = crearItemDesdeInsumo(ins, calcularUnidadesEfectivas(ins));
        nuevo.setAgregadoManual(true);
        return ResponseEntity.ok(itemCompraRepository.save(nuevo));
    }

    /**
     * Actualizador de Precios en Vivo (sin marcar como comprado aún o en cualquier momento)
     * Actualiza el Precio por Kilo en la Bodega correspondiente y recalcula el Precio por Porción.
     */
    @PutMapping("/{id}/actualizar-precio")
    @Transactional
    public ResponseEntity<?> actualizarPrecioEnBodega(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ItemCompra> opt = itemCompraRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ItemCompra item = opt.get();

        double rawPrecioKilo = payload.get("precioKiloNuevo") != null ? Double.parseDouble(payload.get("precioKiloNuevo").toString()) : (item.getPrecioKiloNuevo() != null ? item.getPrecioKiloNuevo() : 0.0);
        if (rawPrecioKilo > 0 && rawPrecioKilo <= 100.0 && !"und".equalsIgnoreCase(item.getMedida())) {
            rawPrecioKilo *= 1000.0;
        }
        final double nuevoPrecioKilo = rawPrecioKilo;
        double cantidadComprar = payload.get("cantidadAComprar") != null ? Double.parseDouble(payload.get("cantidadAComprar").toString()) : (item.getCantidadAComprar() != null ? item.getCantidadAComprar() : 1.0);
        String nota = payload.get("proveedorNota") != null ? payload.get("proveedorNota").toString() : item.getProveedorNota();

        double dosis = (item.getCantidadPorcion() != null && item.getCantidadPorcion() > 0) ? item.getCantidadPorcion() : 30.0;
        String med = (item.getMedida() != null ? item.getMedida() : "gr").toLowerCase();
        double nuevoPrecioPorcion = ("gr".equals(med) || "mls".equals(med))
                ? Math.round((nuevoPrecioKilo / 1000.0) * dosis)
                : Math.round(nuevoPrecioKilo * dosis);

        double costoTotal = payload.get("costoTotalCompra") != null
                ? Double.parseDouble(payload.get("costoTotalCompra").toString())
                : Math.round(nuevoPrecioKilo * cantidadComprar);

        item.setPrecioKiloNuevo((double) Math.round(nuevoPrecioKilo));
        item.setPrecioPorcionNuevo(nuevoPrecioPorcion);
        item.setCantidadAComprar(cantidadComprar);
        item.setCostoTotalCompra((double) Math.round(costoTotal));
        if (nota != null) item.setProveedorNota(nota);
        itemCompraRepository.save(item);

        // Impactar inmediatamente el Precio por Kilo y Precio de Porción en la Bodega
        if (item.getIdInsumo() != null) {
            insumoRepository.findById(item.getIdInsumo()).ifPresent(ins -> {
                String cat = (ins.getCategoria() != null ? ins.getCategoria() : "").toLowerCase();
                boolean isArma = cat.contains("arma") || cat.contains("porcion");
                ins.setPrecioKilo((double) Math.round(nuevoPrecioKilo));
                if (isArma) {
                    ins.setPrecio(nuevoPrecioPorcion);
                } else {
                    ins.setPrecio((double) Math.round(nuevoPrecioKilo));
                }
                insumoRepository.save(ins);
            });
        }

        return ResponseEntity.ok(item);
    }

    /**
     * Cambiar estado del insumo en la Lista de Compras:
     * - COMPRADO: Actualiza Precio por Kilo y Porción en la Bodega, repone el stock comprado,
     *             crea el Gasto automático en Tesorería y guarda el registro en el Historial de Precios y Compras.
     * - PENDIENTE: Revierte a pendiente (y si había un gasto de tesorería asociado lo elimina).
     * - NO_ENCONTRADO: Marca como No Encontrado para permitir borrarlo de la lista o registrarlo en historial.
     */
    @PutMapping("/{id}/estado")
    @Transactional
    public ResponseEntity<?> cambiarEstadoCompra(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<ItemCompra> opt = itemCompraRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ItemCompra item = opt.get();

        String nuevoEstado = payload.get("estado") != null ? payload.get("estado").toString().toUpperCase() : "COMPRADO";
        String estadoAnterior = item.getEstado() != null ? item.getEstado().toUpperCase() : "PENDIENTE";

        double rawPrecioKilo2 = payload.get("precioKiloNuevo") != null
                ? Double.parseDouble(payload.get("precioKiloNuevo").toString())
                : (item.getPrecioKiloNuevo() != null ? item.getPrecioKiloNuevo() : 0.0);
        if (rawPrecioKilo2 > 0 && rawPrecioKilo2 <= 100.0 && !"und".equalsIgnoreCase(item.getMedida())) {
            rawPrecioKilo2 *= 1000.0;
        }
        final double nuevoPrecioKilo = rawPrecioKilo2;

        double cantidadComprar = payload.get("cantidadAComprar") != null
                ? Double.parseDouble(payload.get("cantidadAComprar").toString())
                : (item.getCantidadAComprar() != null && item.getCantidadAComprar() > 0 ? item.getCantidadAComprar() : 1.0);

        String nota = payload.get("proveedorNota") != null ? payload.get("proveedorNota").toString() : item.getProveedorNota();
        boolean reponerStock = payload.get("reponerStock") == null || Boolean.parseBoolean(payload.get("reponerStock").toString());

        double dosis = (item.getCantidadPorcion() != null && item.getCantidadPorcion() > 0) ? item.getCantidadPorcion() : 30.0;
        String med = (item.getMedida() != null ? item.getMedida() : "gr").toLowerCase();
        double nuevoPrecioPorcion = ("gr".equals(med) || "mls".equals(med))
                ? Math.round((nuevoPrecioKilo / 1000.0) * dosis)
                : Math.round(nuevoPrecioKilo * dosis);

        double costoTotal = payload.get("costoTotalCompra") != null
                ? Double.parseDouble(payload.get("costoTotalCompra").toString())
                : Math.round(nuevoPrecioKilo * cantidadComprar);

        item.setPrecioKiloNuevo((double) Math.round(nuevoPrecioKilo));
        item.setPrecioPorcionNuevo(nuevoPrecioPorcion);
        item.setCantidadAComprar(cantidadComprar);
        item.setCostoTotalCompra((double) Math.round(costoTotal));
        if (nota != null) item.setProveedorNota(nota);

        if ("COMPRADO".equals(nuevoEstado) && !"COMPRADO".equals(estadoAnterior)) {
            item.setEstado("COMPRADO");
            item.setFechaCompra(LocalDateTime.now(ZoneId.of("America/Santiago")));
            item.setRegistradoEnHistorial(true);

            // 1. Actualizar Bodega: Precio por Kilo, Precio por Porción y Stock
            if (item.getIdInsumo() != null) {
                insumoRepository.findById(item.getIdInsumo()).ifPresent(ins -> {
                    String cat = (ins.getCategoria() != null ? ins.getCategoria() : "").toLowerCase();
                    String sub = (ins.getSubcategoria() != null ? ins.getSubcategoria() : "").toLowerCase();
                    String nom = (ins.getNombre() != null ? ins.getNombre() : "").toLowerCase();
                    boolean isArma = cat.contains("arma") || cat.contains("porcion");
                    boolean isExot = !isArma && (cat.contains("exot") || cat.contains("exótico") || sub.contains("exot") || nom.contains("exot"));
                    boolean isVaso = !isArma && !isExot && (cat.contains("vaso") || cat.contains("packaging"));
                    boolean esMasaVol = "gr".equals(med) || "mls".equals(med);

                    ins.setPrecioKilo((double) Math.round(nuevoPrecioKilo));
                    if (isArma) {
                        ins.setPrecio(nuevoPrecioPorcion);
                    } else {
                        ins.setPrecio((double) Math.round(nuevoPrecioKilo));
                    }

                    if (reponerStock && cantidadComprar > 0) {
                        double stockActual = ins.getUnidadActual() != null ? Math.max(0.0, ins.getUnidadActual()) : 0.0;
                        double incrementoStock = 0.0;
                        if (isArma) {
                            // En Arma tu Batido el stock se guarda en Porciones. 1 Kilo (1000gr) = 1000 / dosis porciones
                            if (esMasaVol) {
                                incrementoStock = Math.round((cantidadComprar * 1000.0) / Math.max(1.0, dosis));
                            } else {
                                incrementoStock = cantidadComprar;
                            }
                        } else if (isExot && esMasaVol && stockActual > 0 && stockActual < dosis) {
                            // Exóticos estaba en modo porciones; lo pasamos a gramos totales limpios
                            double gramosExistentes = stockActual * dosis;
                            ins.setUnidadActual(gramosExistentes + (cantidadComprar * 1000.0));
                            incrementoStock = cantidadComprar * 1000.0;
                        } else if (esMasaVol) {
                            incrementoStock = cantidadComprar * 1000.0;
                        } else {
                            incrementoStock = cantidadComprar;
                        }

                        if (!(isExot && esMasaVol && stockActual > 0 && stockActual < dosis)) {
                            ins.setUnidadActual(stockActual + incrementoStock);
                        }

                        item.setStockActualUnidades(calcularUnidadesEfectivas(ins));
                        item.setStockActualFisico(ins.getUnidadActual());

                        // Registrar en Kardex
                        MovimientoKardex mk = new MovimientoKardex();
                        mk.setNombreInsumo(ins.getNombre());
                        mk.setCategoria(ins.getCategoria() != null ? ins.getCategoria() : item.getBodega());
                        mk.setSucursal(ins.getSucursal() != null ? ins.getSucursal() : "Antofagasta");
                        mk.setFechaHora(LocalDateTime.now(ZoneId.of("America/Santiago")));
                        mk.setTipoMovimiento("Compra Lista Abastecimiento");
                        mk.setVariacion(incrementoStock);
                        mk.setActor("Lista de Compras -> Tesorería");
                        kardexRepository.save(mk);

                        // Si es vaso/packaging, sincronizar stock de productos 500 mls
                        if (isVaso) {
                            sincronizarStockVasosConProductos(ins);
                        }
                    }
                    insumoRepository.save(ins);
                });
            }

            // 2. Registrar automáticamente como Gasto en Tesorería
            if (costoTotal > 0) {
                Gasto g = new Gasto();
                String unidadLbl = "gr".equals(med) ? "Kg" : ("mls".equals(med) ? "Lt" : "Und");
                g.setConcepto(String.format("🛒 COMPRA BODEGA [%s]: %s (%.1f %s a $%,.0f/%s)",
                        item.getBodega(), item.getNombreInsumo(), cantidadComprar, unidadLbl, nuevoPrecioKilo, unidadLbl));
                g.setMonto((double) Math.round(costoTotal));
                g.setSucursal(item.getSucursal() != null ? item.getSucursal() : "Antofagasta");
                g.setFecha(LocalDateTime.now(ZoneId.of("America/Santiago")));
                g.setArchivada(false);
                Gasto guardado = gastoRepository.save(g);
                item.setIdGastoTesoreria(guardado.getId());
            }

        } else if ("PENDIENTE".equals(nuevoEstado)) {
            // Si estaba comprado y se revierte a PENDIENTE, eliminamos el gasto de Tesorería vinculado para evitar duplicados
            if (item.getIdGastoTesoreria() != null) {
                try { gastoRepository.deleteById(item.getIdGastoTesoreria()); } catch (Exception ignored) {}
                item.setIdGastoTesoreria(null);
            }
            item.setEstado("PENDIENTE");
        } else if ("NO_ENCONTRADO".equals(nuevoEstado)) {
            if (item.getIdGastoTesoreria() != null) {
                try { gastoRepository.deleteById(item.getIdGastoTesoreria()); } catch (Exception ignored) {}
                item.setIdGastoTesoreria(null);
            }
            item.setEstado("NO_ENCONTRADO");
            item.setFechaCompra(LocalDateTime.now(ZoneId.of("America/Santiago")));
            item.setRegistradoEnHistorial(true);
        }

        itemCompraRepository.save(item);
        return ResponseEntity.ok(item);
    }

    /**
     * Borrar un ítem de la lista activa (cuando ya está COMPRADO, NO_ENCONTRADO o cuando el admin decide quitarlo).
     * Si el ítem fue COMPRADO o NO_ENCONTRADO, se conserva en el Historial de Precios y Compras.
     */
    @DeleteMapping("/{id}/de-lista")
    @Transactional
    public ResponseEntity<String> quitarDeListaActiva(@PathVariable Long id) {
        Optional<ItemCompra> opt = itemCompraRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ItemCompra item = opt.get();
        if (item.isRegistradoEnHistorial() || "COMPRADO".equalsIgnoreCase(item.getEstado()) || "NO_ENCONTRADO".equalsIgnoreCase(item.getEstado())) {
            item.setActivoEnLista(false);
            item.setRegistradoEnHistorial(true);
            itemCompraRepository.save(item);
        } else {
            item.setActivoEnLista(false);
            itemCompraRepository.save(item);
        }
        return ResponseEntity.ok("Ítem retirado de la Lista de Compras activa.");
    }

    @DeleteMapping("/limpiar-finalizados")
    @Transactional
    public ResponseEntity<String> limpiarCompradosYNoEncontradosDeLista() {
        List<ItemCompra> activos = itemCompraRepository.findByActivoEnListaTrueOrderByBodegaAscNombreInsumoAsc();
        int count = 0;
        for (ItemCompra item : activos) {
            if ("COMPRADO".equalsIgnoreCase(item.getEstado()) || "NO_ENCONTRADO".equalsIgnoreCase(item.getEstado())) {
                item.setActivoEnLista(false);
                item.setRegistradoEnHistorial(true);
                itemCompraRepository.save(item);
                count++;
            }
        }
        return ResponseEntity.ok(count + " insumos finalizados fueron retirados de la lista activa.");
    }

    @DeleteMapping("/historial/{id}")
    @Transactional
    public ResponseEntity<String> eliminarRegistroHistorial(@PathVariable Long id) {
        Optional<ItemCompra> opt = itemCompraRepository.findById(id);
        if (opt.isPresent()) {
            ItemCompra item = opt.get();
            if (!item.isActivoEnLista()) {
                itemCompraRepository.deleteById(id);
            } else {
                item.setRegistradoEnHistorial(false);
                itemCompraRepository.save(item);
            }
        }
        return ResponseEntity.ok("Registro eliminado del historial.");
    }

    private void sincronizarStockVasosConProductos(Insumo insumo) {
        try {
            String sucursal = insumo.getSucursal() != null ? insumo.getSucursal() : "Antofagasta";
            List<Insumo> insumosSucursal = insumoRepository.findBySucursal(sucursal);
            Double minStock = null;
            for (Insumo item : insumosSucursal) {
                String ic = item.getCategoria() != null ? item.getCategoria().toLowerCase() : "";
                String is = item.getSubcategoria() != null ? item.getSubcategoria().toLowerCase() : "";
                String in = item.getNombre() != null ? item.getNombre().toLowerCase() : "";
                if ((ic.contains("vaso") || ic.contains("packaging") || is.contains("packaging")) &&
                    (in.contains("vaso") || in.contains("tapa") || in.contains("packaging") || in.contains("500") || in.contains("envase"))) {
                    double st = item.getUnidadActual() != null ? Math.max(0.0, item.getUnidadActual()) : 0.0;
                    if (minStock == null || st < minStock) {
                        minStock = st;
                    }
                }
            }
            if (minStock != null) {
                int stockFinal = (int) Math.floor(minStock);
                List<Producto> prods = productoRepository.findBySucursal(sucursal);
                for (Producto p : prods) {
                    if (ProductoController.esProducto500(p)) {
                        p.setStock(stockFinal);
                        productoRepository.save(p);
                    }
                }
            }
        } catch (Exception ignored) {}
    }
}
