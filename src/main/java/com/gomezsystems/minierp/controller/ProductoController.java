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

    @GetMapping
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @GetMapping("/sucursal/{nombreSucursal}")
    public List<Producto> listarPorSucursal(@PathVariable String nombreSucursal) {
        return productoRepository.findBySucursal(nombreSucursal);
    }

    @PostMapping
    public Producto guardar(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        productoRepository.deleteById(id);
    }

    // 5. CARGA MASIVA CON JAVA PURO (Cero dependencias externas)
    @PostMapping("/cargar-csv")
    public ResponseEntity<String> cargarDesdeCSV(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sucursal") String sucursal) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo está vacío");
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            List<Producto> nuevosProductos = new ArrayList<>();
            String linea;
            boolean primeraLinea = true;
            String separador = ","; // Por defecto usa coma, pero detectará punto y coma si es de Excel

            int idxProducto = -1, idxImagen = -1, idxDesc = -1, idxCat = -1, idxPrecio = -1;

            while ((linea = br.readLine()) != null) {
                // Ignorar líneas vacías
                if (linea.trim().isEmpty()) continue;

                if (primeraLinea) {
                    // Detectar si el CSV usa punto y coma
                    if (linea.contains(";")) {
                        separador = ";";
                    }

                    // Leer los títulos de las columnas
                    String[] cabeceras = linea.split(separador);
                    for (int i = 0; i < cabeceras.length; i++) {
                        String cabecera = cabeceras[i].trim().toUpperCase().replace("\"", "");
                        if (cabecera.equals("PRODUCTO")) idxProducto = i;
                        else if (cabecera.equals("IMAGEN")) idxImagen = i;
                        else if (cabecera.equals("DESCRIPCION")) idxDesc = i;
                        else if (cabecera.equals("CATEGORIA")) idxCat = i;
                        else if (cabecera.equals("PRECIO")) idxPrecio = i;
                    }
                    primeraLinea = false;
                    continue;
                }

                // Expresión regular para separar columnas ignorando las que están dentro de comillas
                String[] valores = linea.split(separador + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                try {
                    Producto p = new Producto();

                    if (idxProducto != -1 && valores.length > idxProducto)
                        p.setNombre(valores[idxProducto].trim().replace("\"", ""));

                    if (idxImagen != -1 && valores.length > idxImagen)
                        p.setImagen(valores[idxImagen].trim().replace("\"", ""));

                    if (idxDesc != -1 && valores.length > idxDesc)
                        p.setDescripcion(valores[idxDesc].trim().replace("\"", ""));

                    if (idxCat != -1 && valores.length > idxCat)
                        p.setCategoria(valores[idxCat].trim().replace("\"", ""));

                    if (idxPrecio != -1 && valores.length > idxPrecio) {
                        String precioTexto = valores[idxPrecio].replaceAll("[^0-9.]", "");
                        if (!precioTexto.isEmpty()) {
                            p.setPrecio(Double.parseDouble(precioTexto));
                        }
                    }

                    p.setSucursal(sucursal);
                    p.setStock(0); // Valor inicial por defecto

                    // Solo guardamos si realmente tiene un nombre
                    if (p.getNombre() != null && !p.getNombre().isEmpty()) {
                        nuevosProductos.add(p);
                    }
                } catch (Exception e) {
                    // Si una fila tiene error, la saltamos y continuamos con la siguiente
                    continue;
                }
            }

            productoRepository.saveAll(nuevosProductos);
            return ResponseEntity.ok("¡Éxito! " + nuevosProductos.size() + " productos cargados a la sucursal " + sucursal);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al procesar el CSV: " + e.getMessage());
        }
    }
}