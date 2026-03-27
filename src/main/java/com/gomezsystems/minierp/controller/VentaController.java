package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.model.Venta;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
import com.gomezsystems.minierp.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired private VentaRepository ventaRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private InsumoRepository insumoRepository;

    @GetMapping
    public List<Venta> listarVentas() { return ventaRepository.findAll(); }

    @PostMapping
    public Venta guardarVenta(
            @RequestBody List<Producto> productos,
            @RequestParam(defaultValue = "Caja POS") String origen,
            @RequestParam(defaultValue = "Colombia") String pais,
            @RequestParam(defaultValue = "Pendiente") String estado,
            @RequestParam(defaultValue = "Efectivo") String medioPago) {

        Venta v = new Venta();
        v.setFecha(LocalDateTime.now(ZoneId.of("America/Santiago")));
        double sum = 0.0; for (Producto p : productos) { if (p.getPrecio() != null) sum += p.getPrecio(); }
        v.setTotal(sum); v.setOrigen(origen); v.setPais(pais); v.setEstado(estado); v.setMedioPago(medioPago); v.setProductos(productos);
        return ventaRepository.save(v);
    }

    @PutMapping("/{id}/pagar")
    public ResponseEntity<String> confirmarPago(@PathVariable Long id) {
        Optional<Venta> ventaOpt = ventaRepository.findById(id);
        if (ventaOpt.isPresent()) {
            Venta v = ventaOpt.get();
            if (!"Pagado".equals(v.getEstado())) {
                v.setEstado("Pagado");
                if (v.getProductos() != null) {

                    // FILTRO INTELIGENTE: Trae solo el inventario de la sede de la venta
                    List<Insumo> inventarioLocal = insumoRepository.findBySucursal(v.getPais());

                    for (Producto pVendido : v.getProductos()) {
                        Optional<Producto> prodOpt = productoRepository.findById(pVendido.getId());
                        if(prodOpt.isPresent()){
                            Producto prodReal = prodOpt.get();
                            if (prodReal.getCategoria() != null && prodReal.getCategoria().toLowerCase().contains("pack")) {
                                Integer stockActual = prodReal.getStock() != null ? prodReal.getStock() : 0;
                                prodReal.setStock(stockActual - 1);
                                productoRepository.save(prodReal);
                            } else {
                                if (prodReal.getRecetaDetalle() != null && !prodReal.getRecetaDetalle().trim().isEmpty()) {
                                    String[] lineas = prodReal.getRecetaDetalle().split("\\n");
                                    for (String linea : lineas) {
                                        if (linea.trim().isEmpty()) continue;
                                        String[] partes = linea.split(":");
                                        String nombreIngr = partes[0].trim().toLowerCase();
                                        double cantDesc = 1.0;
                                        if (partes.length > 1) { try { cantDesc = Double.parseDouble(partes[1].trim()); } catch (Exception e) { cantDesc = 1.0; } }

                                        for (Insumo ins : inventarioLocal) {
                                            if (ins.getNombre().trim().toLowerCase().equals(nombreIngr)) {
                                                ins.setUnidadActual((int) (ins.getUnidadActual() - cantDesc));
                                                insumoRepository.save(ins);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ventaRepository.save(v);
                return ResponseEntity.ok("Venta cobrada e inventario local actualizado.");
            } else { return ResponseEntity.badRequest().body("Venta ya pagada."); }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Venta no encontrada");
    }

    @DeleteMapping("/{id}")
    public void eliminarVenta(@PathVariable Long id) { ventaRepository.deleteById(id); }
}