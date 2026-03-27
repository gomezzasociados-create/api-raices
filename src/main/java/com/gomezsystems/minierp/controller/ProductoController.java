package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // 1. OBTENER TODOS (Para el Admin Supremo que ve todo el imperio)
    @GetMapping
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    // 2. NUEVO FILTRO INTELIGENTE: Obtener solo los de una sucursal (Para el POS)
    @GetMapping("/sucursal/{nombreSucursal}")
    public List<Producto> listarPorSucursal(@PathVariable String nombreSucursal) {
        return productoRepository.findBySucursal(nombreSucursal);
    }

    // 3. CREAR O ACTUALIZAR PRODUCTO (Ahora guardará la etiqueta de la sucursal)
    @PostMapping
    public Producto guardar(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    // 4. ELIMINAR PRODUCTO
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        productoRepository.deleteById(id);
    }

    // 5. NUEVO: CARGA MASIVA DESDE CSV (Gomez Systems Import Tool)
    @PostMapping("/cargar-csv")
    public ResponseEntity<String> cargarDesdeCSV(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo está vacío");
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linea;
            boolean esPrimeraLinea = true;
            List<Producto> nuevosProductos = new ArrayList<>();

            while ((linea = br.readLine()) != null) {
                // Saltamos la primera línea si son los títulos de las columnas
                if (esPrimeraLinea) {
                    esPrimeraLinea = false;
                    continue;
                }

                // Separamos por comas (o punto y coma, dependiendo de tu Excel)
                // Si tu Excel guarda con punto y coma, cambia "," por ";"
                String[] datos = linea.split(",");

                // Verificamos que la línea tenga al menos 4 columnas básicas para no dar error
                if (datos.length >= 4) {
                    Producto p = new Producto();
                    p.setNombre(datos[0].trim());       // Columna A: Nombre
                    p.setCategoria(datos[1].trim());    // Columna B: Categoría (o "pack")
                    p.setPrecio(Double.parseDouble(datos[2].trim())); // Columna C: Precio
                    p.setSucursal(datos[3].trim());     // Columna D: Sucursal (COL, CHI, ESP)

                    // Si tienes más campos (como stock o descripción), puedes agregarlos aquí:
                    // p.setStock(Integer.parseInt(datos[4].trim()));
                    // p.setImagen(datos[5].trim());

                    nuevosProductos.add(p);
                }
            }

            productoRepository.saveAll(nuevosProductos);
            return ResponseEntity.ok("¡Éxito! " + nuevosProductos.size() + " productos cargados a la base de datos.");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al procesar el CSV: " + e.getMessage());
        }
    }
}