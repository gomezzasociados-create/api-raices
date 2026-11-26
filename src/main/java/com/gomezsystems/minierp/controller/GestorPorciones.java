package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.model.MovimientoKardex;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
import com.gomezsystems.minierp.repository.KardexRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/insumos")
@CrossOrigin(origins = "*")
public class GestorPorciones {

    @Autowired private InsumoRepository insumoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private KardexRepository kardexRepository;

    @GetMapping("/todos")
    public List<Insumo> listarTodos() {
        return insumoRepository.findAll();
    }

    @GetMapping("/sucursal/{sucursal}")
    public List<Insumo> listarPorSucursal(@PathVariable String sucursal) {
        List<Insumo> lista = insumoRepository.findBySucursal(sucursal);
        if (lista.isEmpty()) {
            lista = insumoRepository.findAll();
        }
        return lista;
    }

    @PostMapping(value = "/guardar", consumes = "application/json")
    public ResponseEntity<String> guardarInsumo(@RequestBody Insumo insumo) {
        try {
            String catLower = insumo.getCategoria() != null ? insumo.getCategoria().toLowerCase() : "";
            boolean esArma = catLower.contains("arma") || catLower.contains("porci");
            String medLower = insumo.getMedida() != null ? insumo.getMedida().toLowerCase() : "gr";
            boolean esMasaVol = "gr".equals(medLower) || "mls".equals(medLower);
            double dosisCal = (insumo.getCantidadPorcion() != null && insumo.getCantidadPorcion() > 0)
                    ? insumo.getCantidadPorcion()
                    : ("und".equals(medLower) ? 1.0 : (esArma ? 30.0 : 50.0));

            // Respetar siempre el precio exacto ingresado por el usuario (desde $1 en cualquier bodega)
            // Mantener precio y precioKilo siempre sincronizados según el tipo de bodega
            if (esArma) {
                Double prPorc = insumo.getPrecio();
                Double prKilo = insumo.getPrecioKilo();
                if (prPorc != null && prPorc > 0 && (prKilo == null || prKilo <= 0)) {
                    double calcKilo = esMasaVol ? Math.round((prPorc * 1000.0) / dosisCal) : (Math.round((prPorc / dosisCal) * 100.0) / 100.0);
                    insumo.setPrecioKilo(calcKilo);
                } else if (prKilo != null && prKilo > 0 && (prPorc == null || prPorc <= 0)) {
                    double calcPorc = esMasaVol ? Math.round((prKilo / 1000.0) * dosisCal) : (Math.round((prKilo * dosisCal) * 100.0) / 100.0);
                    insumo.setPrecio(calcPorc);
                }
            } else {
                if (insumo.getPrecio() != null && insumo.getPrecio() > 0) {
                    insumo.setPrecioKilo(insumo.getPrecio());
                } else if (insumo.getPrecioKilo() != null && insumo.getPrecioKilo() > 0) {
                    insumo.setPrecio(insumo.getPrecioKilo());
                }
            }

            if (insumo.getIdInsumo() != null) {
                Optional<Insumo> existenteOpt = insumoRepository.findById(insumo.getIdInsumo());
                if (existenteOpt.isPresent()) {
                    Insumo existente = existenteOpt.get();
                    
                    Double uaExist = existente.getUnidadActual() != null ? existente.getUnidadActual() : 0.0;
                    Double uaNuevo = insumo.getUnidadActual() != null ? insumo.getUnidadActual() : 0.0;
                    if(!uaExist.equals(uaNuevo)) {
                        MovimientoKardex mk = new MovimientoKardex();
                        mk.setNombreInsumo(insumo.getNombre());
                        mk.setCategoria(insumo.getCategoria());
                        mk.setSucursal(insumo.getSucursal());
                        mk.setFechaHora(LocalDateTime.now());
                        mk.setTipoMovimiento("Edición Manual");
                        mk.setVariacion(uaNuevo - uaExist);
                        mk.setActor(insumo.getActorAdmin() != null ? insumo.getActorAdmin() : "Desconocido");
                        kardexRepository.save(mk);
                    }

                    existente.setNombre(insumo.getNombre());
                    existente.setUnidadActual(insumo.getUnidadActual());
                    existente.setCantidadPorcion(insumo.getCantidadPorcion()); 
                    existente.setMedida(insumo.getMedida());
                    existente.setSucursal(insumo.getSucursal());
                    existente.setCategoria(insumo.getCategoria());
                    existente.setSubcategoria(insumo.getSubcategoria());
                    existente.setPrecio(insumo.getPrecio());
                    existente.setPrecioKilo(insumo.getPrecioKilo());
                    if (insumo.getPrecioVenta() != null) existente.setPrecioVenta(insumo.getPrecioVenta());
                    if (insumo.getMargenPorcentaje() != null) existente.setMargenPorcentaje(insumo.getMargenPorcentaje());
                    if (insumo.getDescuento() != null) existente.setDescuento(insumo.getDescuento());
                    if (insumo.getImagen() != null && !insumo.getImagen().isBlank()) existente.setImagen(insumo.getImagen().trim());
                    insumoRepository.save(existente);
                    sincronizarProductoArmaTuBatido(existente);
                    sincronizarStockVasosConProductos(existente);
                    return ResponseEntity.ok("Insumo actualizado");
                }
            }
            insumoRepository.save(insumo);
            if(insumo.getUnidadActual() != null && insumo.getUnidadActual() > 0) {
                MovimientoKardex mk = new MovimientoKardex();
                mk.setNombreInsumo(insumo.getNombre());
                mk.setCategoria(insumo.getCategoria());
                mk.setSucursal(insumo.getSucursal());
                mk.setFechaHora(LocalDateTime.now());
                mk.setTipoMovimiento("Ingreso Inicial");
                mk.setVariacion(insumo.getUnidadActual());
                mk.setActor(insumo.getActorAdmin() != null ? insumo.getActorAdmin() : "Desconocido");
                kardexRepository.save(mk);
            }
            sincronizarProductoArmaTuBatido(insumo);
            sincronizarStockVasosConProductos(insumo);
            return ResponseEntity.ok("Insumo creado");
        } catch (Exception e) {
            System.err.println("GÓMEZ SYSTEMS - ERROR GRAVE BODEGA: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error BD Bodega: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/imagen")
    public ResponseEntity<String> actualizarImagenInsumo(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String nuevaImagen = body.get("imagen");
        return insumoRepository.findById(id).map(ins -> {
            if (nuevaImagen != null && !nuevaImagen.isBlank()) {
                ins.setImagen(nuevaImagen.trim());
                insumoRepository.save(ins);
                sincronizarProductoArmaTuBatido(ins);
            }
            return ResponseEntity.ok("Imagen de insumo actualizada exitosamente");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void eliminarInsumo(@PathVariable Long id) {
        Optional<Insumo> opt = insumoRepository.findById(id);
        insumoRepository.deleteById(id);
        opt.ifPresent(this::sincronizarStockVasosConProductos);
    }

    // --- CARGA MASIVA DE BODEGA ---
    @PostMapping("/cargar-csv")
    public ResponseEntity<String> cargarDesdeCSV(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sucursal") String sucursal) {

        if (file.isEmpty()) return ResponseEntity.badRequest().body("Archivo vacío");

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(br, CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build())) {

            List<Insumo> nuevosInsumos = new ArrayList<>();

            for (CSVRecord record : csvParser) {
                try {
                    Insumo i = new Insumo();

                    if (record.isMapped("INSUMO")) i.setNombre(record.get("INSUMO"));
                    else if (record.isMapped("NOMBRE")) i.setNombre(record.get("NOMBRE"));

                    if (record.isMapped("UNIDAD")) i.setMedida(record.get("UNIDAD"));
                    else if (record.isMapped("MEDIDA")) i.setMedida(record.get("MEDIDA"));

                    if (record.isMapped("CATEGORIA")) i.setCategoria(record.get("CATEGORIA"));
                    else i.setCategoria("Materia Prima");

                    // Extrae los números del STOCK y los convierte estrictamente a Double
                    if (record.isMapped("STOCK")) {
                        String stockLimpio = record.get("STOCK").replaceAll("[^0-9.]", "");
                        i.setUnidadActual(stockLimpio.isEmpty() ? 0.0 : Double.parseDouble(stockLimpio));
                    } else {
                        i.setUnidadActual(0.0);
                    }

                    // --- NUEVO: CARGAR PRECIO DESDE CSV ---
                    if (record.isMapped("PRECIO")) {
                        String precioLimpio = record.get("PRECIO").replaceAll("[^0-9.]", "");
                        i.setPrecio(precioLimpio.isEmpty() ? 0.0 : Double.parseDouble(precioLimpio));
                    } else if (record.isMapped("VALOR")) {
                        String precioLimpio = record.get("VALOR").replaceAll("[^0-9.]", "");
                        i.setPrecio(precioLimpio.isEmpty() ? 0.0 : Double.parseDouble(precioLimpio));
                    } else {
                        i.setPrecio(0.0);
                    }
                    i.setPrecioKilo(i.getPrecio());

                    // Inicializamos cantidadPorcion en 1 por defecto para evitar nulos
                    i.setCantidadPorcion(1.0);
                    i.setSucursal(sucursal);

                    if(i.getNombre() != null && !i.getNombre().isEmpty()){
                        nuevosInsumos.add(i);
                    }
                } catch (Exception e) {
                    continue;
                }
            }
            insumoRepository.saveAll(nuevosInsumos);
            return ResponseEntity.ok("¡Éxito! " + nuevosInsumos.size() + " insumos clasificados y cargados en " + sucursal + ".");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // --- RUTAS DE FÓRMULAS CON VINCULACIÓN EXACTA A ID DE INSUMO DE BODEGA ---
    @PostMapping("/{idProducto}/vincular-ingrediente")
    public ResponseEntity<String> vincularIngrediente(@PathVariable Long idProducto, @RequestBody Map<String, Object> datos) {
        Optional<Producto> prodOpt = productoRepository.findById(idProducto);
        if (prodOpt.isPresent()) {
            Producto producto = prodOpt.get();
            String ingrediente = datos.get("ingrediente") != null ? datos.get("ingrediente").toString().trim() : "";
            String gasto = datos.get("gasto") != null ? datos.get("gasto").toString().trim() : "";
            String idInsumoStr = datos.get("idInsumo") != null ? datos.get("idInsumo").toString().trim() : "";

            // Si viene idInsumo, tomamos el nombre real de la Bodega para evitar discrepancias
            if (!idInsumoStr.isEmpty()) {
                try {
                    Long idIns = Long.valueOf(idInsumoStr);
                    Optional<Insumo> insOpt = insumoRepository.findById(idIns);
                    if (insOpt.isPresent() && insOpt.get().getNombre() != null) {
                        ingrediente = insOpt.get().getNombre().trim();
                    }
                } catch (Exception ignored) {}
            }

            if (ingrediente.isEmpty() || gasto.isEmpty()) {
                return ResponseEntity.badRequest().body("Datos de fórmula incompletos");
            }

            String nuevaLinea = !idInsumoStr.isEmpty()
                    ? (ingrediente + ":" + gasto + ":" + idInsumoStr)
                    : (ingrediente + ":" + gasto);

            String recetaActual = producto.getRecetaDetalle();
            if (recetaActual == null || recetaActual.trim().isEmpty()) {
                producto.setRecetaDetalle(nuevaLinea);
            } else {
                StringBuilder sb = new StringBuilder();
                boolean reemplazado = false;
                for (String linea : recetaActual.split("\\n")) {
                    if (linea.trim().isEmpty()) continue;
                    String[] p = linea.split(":");
                    String nomExist = p.length > 0 ? p[0].trim() : "";
                    String idExist = p.length >= 3 ? p[2].trim() : "";
                    boolean mismoInsumo = (!idInsumoStr.isEmpty() && !idExist.isEmpty() && idInsumoStr.equals(idExist))
                            || (idExist.isEmpty() && nomExist.equalsIgnoreCase(ingrediente))
                            || (idInsumoStr.isEmpty() && nomExist.equalsIgnoreCase(ingrediente));
                    if (mismoInsumo) {
                        if (!reemplazado) {
                            sb.append(nuevaLinea).append("\n");
                            reemplazado = true;
                        }
                    } else {
                        sb.append(linea.trim()).append("\n");
                    }
                }
                if (!reemplazado) {
                    sb.append(nuevaLinea);
                }
                producto.setRecetaDetalle(sb.toString().trim());
            }
            productoRepository.save(producto);
            return ResponseEntity.ok("Vínculo exitoso");
        }
        return ResponseEntity.badRequest().body("Producto no encontrado");
    }

    @GetMapping("/{idProducto}/receta")
    public ResponseEntity<String> verReceta(@PathVariable Long idProducto) {
        Optional<Producto> prodOpt = productoRepository.findById(idProducto);
        if (prodOpt.isPresent() && prodOpt.get().getRecetaDetalle() != null) {
            return ResponseEntity.ok(prodOpt.get().getRecetaDetalle());
        }
        return ResponseEntity.ok("");
    }

    @DeleteMapping("/{idProducto}/desvincular/{nombreIngrediente}")
    public ResponseEntity<String> desvincularIngrediente(@PathVariable Long idProducto, @PathVariable String nombreIngrediente) {
        Optional<Producto> prodOpt = productoRepository.findById(idProducto);
        if (prodOpt.isPresent()) {
            Producto producto = prodOpt.get();
            String recetaActual = producto.getRecetaDetalle();
            if (recetaActual != null && !recetaActual.isEmpty()) {
                String targetTrim = nombreIngrediente != null ? nombreIngrediente.trim() : "";
                boolean buscarPorId = targetTrim.toLowerCase().startsWith("id:");
                String targetId = buscarPorId ? targetTrim.substring(3).trim() : "";

                StringBuilder nuevaReceta = new StringBuilder();
                String[] lineas = recetaActual.split("\\n");
                for (String linea : lineas) {
                    if (linea.trim().isEmpty()) continue;
                    String[] p = linea.split(":");
                    String nombreEnLinea = p[0].trim();
                    String idEnLinea = p.length >= 3 ? p[2].trim() : "";
                    boolean coincide = buscarPorId
                            ? (!targetId.isEmpty() && targetId.equals(idEnLinea))
                            : nombreEnLinea.equalsIgnoreCase(targetTrim);
                    if (!coincide) {
                        nuevaReceta.append(linea.trim()).append("\n");
                    }
                }
                producto.setRecetaDetalle(nuevaReceta.toString().trim());
                productoRepository.save(producto);
                return ResponseEntity.ok("Ingrediente eliminado");
            }
        }
        return ResponseEntity.badRequest().body("Error al eliminar");
    }
    private void sincronizarProductoArmaTuBatido(Insumo insumo) {
        // Los insumos pertenecen exclusivamente a Bodega y no deben crearse como productos comerciales
    }

    private void sincronizarStockVasosConProductos(Insumo insumo) {
        if (insumo == null) return;
        String c = insumo.getCategoria() != null ? insumo.getCategoria().toLowerCase() : "";
        String s = insumo.getSubcategoria() != null ? insumo.getSubcategoria().toLowerCase() : "";
        String n = insumo.getNombre() != null ? insumo.getNombre().toLowerCase() : "";
        if (c.contains("vaso") || c.contains("packaging") || s.contains("packaging") || n.contains("vaso") || n.contains("tapa")) {
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
                int stockFinal = (minStock != null) ? (int) Math.floor(minStock) : 0;
                List<Producto> prods = productoRepository.findBySucursal(sucursal);
                for (Producto p : prods) {
                    if (ProductoController.esProducto500(p)) {
                        p.setStock(stockFinal);
                        productoRepository.save(p);
                    }
                }
            } catch (Exception ignored) {}
        }
    }
}