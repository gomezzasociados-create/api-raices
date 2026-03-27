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
@RequestMapping("/api/insumos")
@CrossOrigin(origins = "*")
public class GestorPorciones {

    @Autowired private InsumoRepository insumoRepository;
    @Autowired private ProductoRepository productoRepository;

    @GetMapping("/todos")
    public List<Insumo> listarTodos() { return insumoRepository.findAll(); }

    @GetMapping("/sucursal/{sucursal}")
    public List<Insumo> listarPorSucursal(@PathVariable String sucursal) {
        return insumoRepository.findBySucursal(sucursal);
    }

    @PostMapping("/guardar")
    public ResponseEntity<String> guardarInsumo(@RequestBody Insumo insumo) {
        if (insumo.getIdInsumo() != null) {
            Optional<Insumo> existenteOpt = insumoRepository.findById(insumo.getIdInsumo());
            if (existenteOpt.isPresent()) {
                Insumo existente = existenteOpt.get();
                existente.setNombre(insumo.getNombre());
                existente.setUnidadActual(insumo.getUnidadActual());
                existente.setMedida(insumo.getMedida());
                existente.setSucursal(insumo.getSucursal()); // GUARDA EL PAÍS
                insumoRepository.save(existente);
                return ResponseEntity.ok("Insumo actualizado");
            }
        }
        insumoRepository.save(insumo);
        return ResponseEntity.ok("Insumo creado");
    }

    @DeleteMapping("/{id}")
    public void eliminarInsumo(@PathVariable Long id) { insumoRepository.deleteById(id); }

    // RUTAS DE FÓRMULAS MANTIENEN SU ESTRUCTURA NORMAL
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