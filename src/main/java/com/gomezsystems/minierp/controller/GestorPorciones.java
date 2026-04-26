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
        return insumoRepository.findBySucursal(sucursal);
    }

    @PostMapping("/guardar")
    public ResponseEntity<String> guardarInsumo(@RequestBody Insumo insumo) {
        try {
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
                    existente.setPrecio(insumo.getPrecio());
                    insumoRepository.save(existente);
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
            return ResponseEntity.ok("Insumo creado");
        } catch (Exception e) {
            System.err.println("GÓMEZ SYSTEMS - ERROR GRAVE BODEGA: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error BD Bodega: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void eliminarInsumo(@PathVariable Long id) {
        insumoRepository.deleteById(id);
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

                    // Inicializamos cantidadPorcion en 1 por defecto para evitar nulos
                    i.setCantidadPorcion(1);
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

    // --- RUTAS DE FÓRMULAS MANTIENEN SU ESTRUCTURA NORMAL ---
    @PostMapping("/{idProducto}/vincular-ingrediente")
    public ResponseEntity<String> vincularIngrediente(@PathVariable Long idProducto, @RequestBody Map<String, Object> datos) {
        Optional<Producto> prodOpt = productoRepository.findById(idProducto);
        if (prodOpt.isPresent()) {
            Producto producto = prodOpt.get();
            String ingrediente = datos.get("ingrediente").toString().trim();
            String gasto = datos.get("gasto").toString().trim();
            String nuevaLinea = ingrediente + ":" + gasto;
            String recetaActual = producto.getRecetaDetalle();
            if (recetaActual == null || recetaActual.isEmpty()) producto.setRecetaDetalle(nuevaLinea);
            else producto.setRecetaDetalle(recetaActual + "\n" + nuevaLinea);
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
                StringBuilder nuevaReceta = new StringBuilder();
                String[] lineas = recetaActual.split("\\n");
                for (String linea : lineas) {
                    if (linea.trim().isEmpty()) continue;
                    String nombreEnLinea = linea.split(":")[0].trim().toLowerCase();
                    if (!nombreEnLinea.equals(nombreIngrediente.toLowerCase())) {
                        nuevaReceta.append(linea).append("\n");
                    }
                }
                producto.setRecetaDetalle(nuevaReceta.toString().trim());
                productoRepository.save(producto);
                return ResponseEntity.ok("Ingrediente eliminado");
            }
        }
        return ResponseEntity.badRequest().body("Error al eliminar");
    }
}