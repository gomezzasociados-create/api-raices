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
import java.io.Reader;
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

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Long id, @RequestBody Producto nuevoProducto) {
        return productoRepository.findById(id).map(prod -> {
            prod.setNombre(nuevoProducto.getNombre());
            prod.setCategoria(nuevoProducto.getCategoria());
            prod.setPrecio(nuevoProducto.getPrecio());
            prod.setImagen(nuevoProducto.getImagen());
            prod.setDescripcion(nuevoProducto.getDescripcion());
            return ResponseEntity.ok(productoRepository.save(prod));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/ajustar-stock")
    public ResponseEntity<String> ajustarStock(@PathVariable Long id, @RequestParam int cantidad) {
        return productoRepository.findById(id).map(prod -> {
            prod.setStock(cantidad);
            productoRepository.save(prod);
            return ResponseEntity.ok("Stock ajustado sin requerir descuento molecular");
        }).orElse(ResponseEntity.badRequest().body("Producto no encontrado"));
    }

    // 🚨 RUTA DE EMERGENCIA: Limpia toda la base de datos de productos 🚨
    @GetMapping("/limpiar")
    public String limpiarTodo() {
        productoRepository.deleteAll();
        return "Catálogo borrado por completo. La base de datos está limpia.";
    }

    // 🚀 CARGA MASIVA INTELIGENTE (Soporta saltos de línea y viñetas en descripciones)
    @PostMapping("/cargar-csv")
    public ResponseEntity<String> cargarDesdeCSV(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sucursal") String sucursal) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo está vacío");
        }

        // Usamos BufferedReader para poder leer el archivo caracter por caracter sin errores
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            List<String[]> filas = parseCsv(reader);
            if (filas.isEmpty() || filas.size() == 1) return ResponseEntity.badRequest().body("El CSV está vacío o solo tiene títulos.");

            String[] cabeceras = filas.get(0);
            int idxProducto = -1, idxImagen = -1, idxDesc = -1, idxCat = -1, idxPrecio = -1;

            // Mapeo Automático de Columnas
            for (int i = 0; i < cabeceras.length; i++) {
                String c = cabeceras[i].trim().toUpperCase().replace("\"", "");
                if (c.equals("PRODUCTO") || c.equals("NOMBRE") || c.equals("BATIDO")) idxProducto = i;
                else if (c.equals("IMAGEN") || c.equals("FOTO") || c.equals("URL")) idxImagen = i;
                else if (c.equals("DESCRIPCION") || c.equals("DETALLE")) idxDesc = i;
                else if (c.equals("CATEGORIA") || c.equals("TIPO")) idxCat = i;
                else if (c.equals("PRECIO") || c.equals("VALOR")) idxPrecio = i;
            }

            if (idxProducto == -1) {
                return ResponseEntity.badRequest().body("Error: El Excel debe tener una columna llamada 'PRODUCTO' o 'NOMBRE'.");
            }

            List<Producto> nuevosProductos = new ArrayList<>();

            // Leer los datos saltando la fila 0 (que son los títulos)
            for (int i = 1; i < filas.size(); i++) {
                String[] valores = filas.get(i);

                try {
                    Producto p = new Producto();

                    if (valores.length > idxProducto) p.setNombre(valores[idxProducto].trim());

                    // Si la fila está vacía o no tiene nombre, la ignoramos (evita basura)
                    if (p.getNombre() == null || p.getNombre().isEmpty()) continue;

                    if (idxImagen != -1 && valores.length > idxImagen) p.setImagen(valores[idxImagen].trim());
                    if (idxDesc != -1 && valores.length > idxDesc) p.setDescripcion(valores[idxDesc].trim());
                    if (idxCat != -1 && valores.length > idxCat) p.setCategoria(valores[idxCat].trim());

                    if (idxPrecio != -1 && valores.length > idxPrecio) {
                        String txt = valores[idxPrecio].replaceAll("[^0-9.]", "");
                        if (!txt.isEmpty()) p.setPrecio(Double.parseDouble(txt));
                    }

                    p.setSucursal(sucursal);
                    p.setStock(0);
                    nuevosProductos.add(p);

                } catch (Exception e) {
                    continue;
                }
            }

            productoRepository.saveAll(nuevosProductos);
            return ResponseEntity.ok("¡Éxito! " + nuevosProductos.size() + " batidos subidos correctamente a " + sucursal);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno procesando el archivo: " + e.getMessage());
        }
    }

    // Lector manual de CSV para soportar comillas y Enters dentro de las celdas de Excel
    private List<String[]> parseCsv(BufferedReader reader) throws Exception {
        List<String[]> records = new ArrayList<>();
        List<String> currentRecord = new ArrayList<>();
        StringBuilder currentField = new StringBuilder();
        boolean inQuotes = false;
        int ch;

        while ((ch = reader.read()) != -1) {
            char c = (char) ch;
            if (inQuotes) {
                if (c == '"') {
                    reader.mark(1);
                    int next = reader.read();
                    if (next == '"') {
                        currentField.append('"');
                    } else {
                        inQuotes = false;
                        if (next != -1) reader.reset();
                    }
                } else {
                    currentField.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',' || c == ';') {
                    currentRecord.add(currentField.toString());
                    currentField.setLength(0);
                } else if (c == '\n' || c == '\r') {
                    // Ignora líneas completamente en blanco
                    if (currentField.length() > 0 || !currentRecord.isEmpty()) {
                        currentRecord.add(currentField.toString());
                        records.add(currentRecord.toArray(new String[0]));
                        currentRecord.clear();
                        currentField.setLength(0);
                    }
                    if (c == '\r') {
                        reader.mark(1);
                        int next = reader.read();
                        if (next != -1 && next != '\n') reader.reset();
                    }
                } else {
                    currentField.append(c);
                }
            }
        }
        if (currentField.length() > 0 || !currentRecord.isEmpty()) {
            currentRecord.add(currentField.toString());
            records.add(currentRecord.toArray(new String[0]));
        }
        return records;
    }
}