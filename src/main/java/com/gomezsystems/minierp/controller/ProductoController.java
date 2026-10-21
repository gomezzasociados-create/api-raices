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
    @Autowired
    private com.gomezsystems.minierp.repository.InsumoRepository insumoRepository;

    @GetMapping
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    @GetMapping("/sucursal/{nombreSucursal}")
    public List<Producto> listarPorSucursal(@PathVariable String nombreSucursal) {
        List<Producto> lista = productoRepository.findBySucursal(nombreSucursal);
        if (lista.isEmpty()) {
            lista = productoRepository.findAll();
        }
        return lista;
    }

    @PostMapping
    public Producto guardar(@RequestBody Producto producto) {
        if (producto.getPrecio() != null && producto.getPrecio() > 0 && producto.getPrecio() <= 100.0) {
            producto.setPrecio(producto.getPrecio() * 1000.0);
        }
        if (producto.getDescuento() == null) {
            producto.setDescuento(0.0);
        }
        return productoRepository.save(producto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        productoRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Long id, @RequestBody Producto nuevoProducto) {
        return productoRepository.findById(id).map(prod -> {
            if (nuevoProducto.getNombre() != null) prod.setNombre(nuevoProducto.getNombre());
            if (nuevoProducto.getCategoria() != null) prod.setCategoria(nuevoProducto.getCategoria());
            if (nuevoProducto.getPrecio() != null) {
                Double pr = nuevoProducto.getPrecio();
                if (pr > 0 && pr <= 100.0) pr = pr * 1000.0;
                nuevoProducto.setPrecio(pr);
                prod.setPrecio(pr);
            }
            if (nuevoProducto.getDescuento() != null) prod.setDescuento(nuevoProducto.getDescuento());
            if (nuevoProducto.getImagen() != null) prod.setImagen(nuevoProducto.getImagen());
            if (nuevoProducto.getDescripcion() != null) prod.setDescripcion(nuevoProducto.getDescripcion());
            if (nuevoProducto.getSucursal() != null) prod.setSucursal(nuevoProducto.getSucursal());
            if (nuevoProducto.getStock() != null) prod.setStock(nuevoProducto.getStock());
            Producto guardado = productoRepository.save(prod);

            // Sincronizar automáticamente con la Bodega de Insumos si es de Arma tu Batido
            String catProd = prod.getCategoria() != null ? prod.getCategoria().toLowerCase() : "";
            if (catProd.contains("arma") || catProd.contains("batido")) {
                try {
                    String nomProd = prod.getNombre() != null ? prod.getNombre().trim() : "";
                    for (com.gomezsystems.minierp.model.Insumo ins : insumoRepository.findAll()) {
                        if (ins.getNombre() != null && ins.getNombre().trim().equalsIgnoreCase(nomProd)) {
                            if (nuevoProducto.getPrecio() != null) ins.setPrecio(nuevoProducto.getPrecio());
                            if (nuevoProducto.getDescuento() != null) ins.setDescuento(nuevoProducto.getDescuento());
                            if (nuevoProducto.getImagen() != null) ins.setImagen(nuevoProducto.getImagen());
                            if (nuevoProducto.getStock() != null) ins.setUnidadActual(nuevoProducto.getStock().doubleValue());
                            insumoRepository.save(ins);
                        }
                    }
                } catch (Exception ignored) {}
            }

            // Sincronizar precio y descuento en duplicados con el mismo nombre si se actualizó
            if (prod.getNombre() != null && !prod.getNombre().trim().isEmpty()) {
                String nombreBase = prod.getNombre().trim();
                for (Producto p : productoRepository.findAll()) {
                    if (p.getId() != null && !p.getId().equals(prod.getId()) &&
                        p.getNombre() != null && p.getNombre().trim().equalsIgnoreCase(nombreBase)) {
                        if (nuevoProducto.getPrecio() != null) p.setPrecio(nuevoProducto.getPrecio());
                        if (nuevoProducto.getDescuento() != null) p.setDescuento(nuevoProducto.getDescuento());
                        productoRepository.save(p);
                    }
                }
            }
            return ResponseEntity.ok(guardado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/precio")
    public ResponseEntity<Producto> actualizarPrecio(@PathVariable Long id, @RequestParam Double precio) {
        final Double precioFinal = (precio != null && precio > 0 && precio <= 100.0) ? precio * 1000.0 : precio;
        return productoRepository.findById(id).map(prod -> {
            prod.setPrecio(precioFinal);
            Producto guardado = productoRepository.save(prod);

            // Sincronizar precio en todos los duplicados con el mismo nombre
            if (prod.getNombre() != null && !prod.getNombre().trim().isEmpty()) {
                String nombreBase = prod.getNombre().trim();
                for (Producto p : productoRepository.findAll()) {
                    if (p.getId() != null && !p.getId().equals(prod.getId()) &&
                        p.getNombre() != null && p.getNombre().trim().equalsIgnoreCase(nombreBase)) {
                        p.setPrecio(precioFinal);
                        productoRepository.save(p);
                    }
                }
            }
            return ResponseEntity.ok(guardado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/descuento")
    public ResponseEntity<Producto> actualizarDescuento(@PathVariable Long id, @RequestParam Double descuento) {
        final Double descFinal = (descuento != null && descuento >= 0.0) ? descuento : 0.0;
        return productoRepository.findById(id).map(prod -> {
            prod.setDescuento(descFinal);
            Producto guardado = productoRepository.save(prod);

            // Sincronizar descuento en todos los duplicados con el mismo nombre
            if (prod.getNombre() != null && !prod.getNombre().trim().isEmpty()) {
                String nombreBase = prod.getNombre().trim();
                for (Producto p : productoRepository.findAll()) {
                    if (p.getId() != null && !p.getId().equals(prod.getId()) &&
                        p.getNombre() != null && p.getNombre().trim().equalsIgnoreCase(nombreBase)) {
                        p.setDescuento(descFinal);
                        productoRepository.save(p);
                    }
                }
            }
            return ResponseEntity.ok(guardado);
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
            int idxProducto = -1, idxImagen = -1, idxDesc = -1, idxCat = -1, idxPrecio = -1, idxDto = -1;

            // Mapeo Automático de Columnas
            for (int i = 0; i < cabeceras.length; i++) {
                String c = cabeceras[i].trim().toUpperCase().replace("\"", "");
                if (c.equals("PRODUCTO") || c.equals("NOMBRE") || c.equals("BATIDO")) idxProducto = i;
                else if (c.equals("IMAGEN") || c.equals("FOTO") || c.equals("URL")) idxImagen = i;
                else if (c.equals("DESCRIPCION") || c.equals("DETALLE")) idxDesc = i;
                else if (c.equals("CATEGORIA") || c.equals("TIPO")) idxCat = i;
                else if (c.equals("PRECIO") || c.equals("VALOR")) idxPrecio = i;
                else if (c.contains("DESCUENTO") || c.contains("DTO") || c.contains("OFF")) idxDto = i;
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
                        if (!txt.isEmpty()) {
                            double val = Double.parseDouble(txt);
                            if (val > 0 && val <= 100.0) val = val * 1000.0;
                            p.setPrecio(val);
                        }
                    }

                    if (idxDto != -1 && valores.length > idxDto) {
                        String txt = valores[idxDto].replaceAll("[^0-9.]", "");
                        if (!txt.isEmpty()) p.setDescuento(Double.parseDouble(txt));
                    } else {
                        p.setDescuento(0.0);
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
