package com.gomezsystems.minierp.service;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.MovimientoKardex;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.model.Receta;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.KardexRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
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
    private ProductoRepository productoRepository;

    @Autowired
    private WhatsAppNotificationService whatsAppNotificationService;

    private String normalizar(String str) {
        if (str == null) return "";
        String s = str.replace("Ã‘", "n").replace("Ã±", "n")
                      .replace("Ã¡", "a").replace("Ã©", "e").replace("Ã­", "i").replace("Ã³", "o").replace("Ãº", "u")
                      .replace("ñ", "n").replace("Ñ", "n");
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase().trim();
    }

    @Transactional
    public void procesarVenta(Long idProductoVendido, int cantidadVendida, String actorCausa) {

        Optional<Producto> prodOpt = productoRepository.findById(idProductoVendido);
        if (!prodOpt.isPresent()) {
            System.out.println("Aviso: El producto con ID " + idProductoVendido + " no existe.");
            return;
        }

        Producto producto = prodOpt.get();
        String catProd = producto.getCategoria() != null ? producto.getCategoria().toLowerCase() : "";
        String nomProd = producto.getNombre() != null ? producto.getNombre().toLowerCase() : "";
        boolean esBatido500 = catProd.contains("arma tu batido") || catProd.contains("batido") || catProd.contains("500") || nomProd.contains("batido") || nomProd.contains("500");
        boolean esArmaTuBatido = catProd.contains("arma tu batido") || catProd.contains("personalizado") || nomProd.contains("arma tu batido") || nomProd.contains("batido armado") || nomProd.contains("batido personalizado");

        List<Insumo> insumosSucursal = insumoRepository.findBySucursal(producto.getSucursal());
        if (insumosSucursal == null || insumosSucursal.isEmpty()) {
            insumosSucursal = insumoRepository.findAll();
        }

        // 1. PROCESAR INGREDIENTES / RECETA
        List<Receta> ingredientes = recetaRepository.findByIdProducto(idProductoVendido);

        if (ingredientes.isEmpty()) {
            // Lectura desde recetaDetalle del Producto (Arma tu Batido o productos dinámicos)
            if (producto.getRecetaDetalle() != null && !producto.getRecetaDetalle().trim().isEmpty()) {
                String[] lineas = producto.getRecetaDetalle().split("\\n");
                
                for (String linea : lineas) {
                    String[] partes = linea.split(":");
                    if (partes.length < 2) continue;
                    
                    String nombreLimpio = partes[0].trim().toLowerCase();
                    double gasto = 0;
                    try { 
                        String cantClean = partes[1].replaceAll("[^0-9.]", "").trim();
                        gasto = Double.parseDouble(cantClean); 
                    } catch(Exception e) { 
                        continue; 
                    }
                    if (gasto <= 0) continue;
                    
                    Insumo insumoMatch = null;
                    String nomLimpioNorm = normalizar(nombreLimpio);
                    // REGLA SAGRADA: Para "Arma tu Batido", buscar en la bodega de Arma tu Batido / Porciones
                    for (Insumo ins : insumosSucursal) {
                        String catIns = ins.getCategoria() != null ? ins.getCategoria().toLowerCase() : "";
                        if (catIns.contains("arma tu batido") || catIns.contains("porciones")) {
                            String insNombre = normalizar(ins.getNombre());
                            if (insNombre.equals(nomLimpioNorm) || insNombre.contains(nomLimpioNorm) || nomLimpioNorm.contains(insNombre)) {
                                insumoMatch = ins;
                                break;
                            }
                        }
                    }

                    // Si no es Arma tu Batido y no se encontró, buscar en otras categorías que NO sean Pulpas
                    // (Las pulpas se descuentan únicamente al ingresar producción en Génesis Producción)
                    if (insumoMatch == null && !esArmaTuBatido) {
                        for (Insumo ins : insumosSucursal) {
                            String catIns = ins.getCategoria() != null ? ins.getCategoria().toLowerCase() : "";
                            if (!catIns.contains("pulpa")) {
                                String insNombre = normalizar(ins.getNombre());
                                if (insNombre.equals(nomLimpioNorm) || insNombre.contains(nomLimpioNorm) || nomLimpioNorm.contains(insNombre)) {
                                    insumoMatch = ins;
                                    break;
                                }
                            }
                        }
                    }

                    if (insumoMatch != null) {
                        double totalADescontar = gasto * cantidadVendida;
                        // Para Arma tu Batido, la bodega almacena PORCIONES (ej. 6 porciones).
                        // Si el gasto vino en gramos (ej. 50, 120), lo convertimos al número de porciones
                        // para evitar descontar 120 unidades de golpe y dejar el stock en negativo.
                        if (esArmaTuBatido) {
                            double dosis = (insumoMatch.getCantidadPorcion() != null && insumoMatch.getCantidadPorcion() > 5.0)
                                    ? insumoMatch.getCantidadPorcion() : 1.0;
                            if (gasto >= dosis && dosis > 5.0) {
                                totalADescontar = Math.max(1.0, Math.round(gasto / dosis)) * cantidadVendida;
                            } else {
                                totalADescontar = Math.max(1.0, gasto) * cantidadVendida;
                            }
                        }
                        descontarInsumo(insumoMatch, totalADescontar, actorCausa);
                    } else {
                        System.out.println("Aviso Venta: No se encontró insumo en bodega para '" + nombreLimpio + "' (No se descuenta de pulpas).");
                    }
                }
            }
        } else {
            // Recetas pre-configuradas (excluyendo bodega de pulpas)
            for (Receta receta : ingredientes) {
                Optional<Insumo> insumoOpt = insumoRepository.findById(receta.getIdInsumo());
                if (insumoOpt.isPresent()) {
                    Insumo ins = insumoOpt.get();
                    String catIns = ins.getCategoria() != null ? ins.getCategoria().toLowerCase() : "";
                    if (!catIns.contains("pulpa")) {
                        descontarInsumo(ins, receta.getCantidadNecesaria() * cantidadVendida, actorCausa);
                    }
                }
            }
        }

        // 2. DESCUENTO AUTOMÁTICO DE PACKAGING / VASOS AL VENDER UN BATIDO DE 500
        if (esBatido500) {
            for (Insumo ins : insumosSucursal) {
                String catIns = ins.getCategoria() != null ? ins.getCategoria().toLowerCase() : "";
                String subcatIns = ins.getSubcategoria() != null ? ins.getSubcategoria().toLowerCase() : "";
                String nomIns = ins.getNombre() != null ? ins.getNombre().toLowerCase() : "";

                boolean esPackaging = catIns.contains("vaso") || catIns.contains("packaging") || subcatIns.contains("packaging");
                if (esPackaging) {
                    if (nomIns.contains("vaso")) {
                        descontarInsumo(ins, 1.0 * cantidadVendida, "Bodega Vasos (Batido 500cc): " + actorCausa);
                    } else if (nomIns.contains("tapa")) {
                        descontarInsumo(ins, 1.0 * cantidadVendida, "Bodega Tapas (Batido 500cc): " + actorCausa);
                    }
                }
            }
        }
    }

    private void descontarInsumo(Insumo insumo, double totalADescontar, String actorCausa) {
        double nuevoStock = insumo.getUnidadActual() - totalADescontar;
        if (nuevoStock < 0) {
            nuevoStock = 0; // Prevenir valores negativos que provoquen estados erróneos en el menú
        }
        
        // Alerta específica para Administrador en Bodega de Vasos 500 mls (Umbral <= 10)
        String catIns = insumo.getCategoria() != null ? insumo.getCategoria().toLowerCase() : "";
        if (catIns.contains("vaso") || catIns.contains("packaging")) {
            if (nuevoStock <= 10) {
                System.out.println("⚠️ [AVISO ADMINISTRADOR - BODEGA VASOS 500 MLS] Umbral bajo detectado en '" + insumo.getNombre() + "': " + nuevoStock + " " + insumo.getMedida() + " restantes.");
                if (whatsAppNotificationService != null) {
                    whatsAppNotificationService.enviarAlertaUmbralBajoVasos(
                        insumo.getNombre(),
                        nuevoStock,
                        insumo.getMedida(),
                        insumo.getSucursal()
                    );
                }
            }
        }

        insumo.setUnidadActual(nuevoStock);
        insumoRepository.save(insumo);

        // Mantener sincronizado el catálogo de productos para Arma tu Batido
        if (catIns.contains("arma") || catIns.contains("porciones")) {
            try {
                String nomNorm = normalizar(insumo.getNombre());
                for (Producto p : productoRepository.findAll()) {
                    String catP = p.getCategoria() != null ? p.getCategoria().toLowerCase() : "";
                    if (catP.contains("arma") || catP.contains("batido")) {
                        if (normalizar(p.getNombre()).equals(nomNorm)) {
                            p.setStock((int) Math.max(0, Math.round(nuevoStock)));
                            productoRepository.save(p);
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

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
