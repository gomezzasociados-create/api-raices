package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.DetalleVenta;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.model.Venta;
import com.gomezsystems.minierp.repository.ProductoRepository;
import com.gomezsystems.minierp.repository.VentaRepository;
import com.gomezsystems.minierp.service.InventarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ventas")
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired private VentaRepository ventaRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private InventarioService inventarioService;

    @GetMapping
    public List<Venta> listarVentas() { return ventaRepository.findAll(); }

    @PostMapping
    @Transactional
    public Venta guardarVenta(@RequestBody Map<String, Object> payload, @RequestParam(required = false) String metodo) {

        Venta v = new Venta();
        v.setFecha(LocalDateTime.now(ZoneId.of("America/Santiago")));
        v.setEstado("Pendiente");
        v.setMedioPago(metodo != null ? metodo : "Efectivo");

        if (payload.containsKey("origen")) v.setOrigen(payload.get("origen").toString());
        else v.setOrigen("Caja POS");
        
        if (payload.containsKey("pais")) v.setPais(payload.get("pais").toString());
        else v.setPais("Colombia");

        if (payload.containsKey("cliente")) {
            Map<String, String> clienteData = (Map<String, String>) payload.get("cliente");
            if (clienteData.containsKey("nombre")) v.setNombreCliente(clienteData.get("nombre"));
        }

        // Agrupar items repetidos en "DetalleVenta" para mantener integridad de cantidades y DB norm
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        Map<Long, DetalleVenta> detailsMap = new HashMap<>();
        double sumTotal = 0.0;

        if (items != null) {
            for (Map<String, Object> itemReq : items) {
                Long pId = Long.parseLong(itemReq.get("id").toString());
                double pPrecio = Double.parseDouble(itemReq.get("precio").toString());
                
                Optional<Producto> prodOpt = productoRepository.findById(pId);
                if (prodOpt.isPresent()) {
                    if (detailsMap.containsKey(pId)) {
                        DetalleVenta det = detailsMap.get(pId);
                        det.setCantidad(det.getCantidad() + 1);
                        det.setSubtotal(det.getCantidad() * pPrecio);
                    } else {
                        DetalleVenta det = new DetalleVenta();
                        det.setProducto(prodOpt.get());
                        det.setCantidad(1);
                        det.setSubtotal(pPrecio);
                        detailsMap.put(pId, det);
                    }
                    sumTotal += pPrecio;
                }
            }
        }

        for (DetalleVenta dv : detailsMap.values()) {
            v.addDetalle(dv);
        }

        v.setTotal(sumTotal);
        return ventaRepository.save(v);
    }

    @PutMapping("/{id}/pagar")
    @Transactional
    public ResponseEntity<String> confirmarPago(@PathVariable Long id) {
        Optional<Venta> ventaOpt = ventaRepository.findById(id);
        if (ventaOpt.isPresent()) {
            Venta v = ventaOpt.get();
            if (!"Pagado".equals(v.getEstado())) {
                v.setEstado("Pagado");
                
                if (v.getDetalles() != null) {
                    for (DetalleVenta dv : v.getDetalles()) {
                        Producto prodReal = dv.getProducto();
                        
                        // Si es un pack, se reduce el stock base (1 * cantidad vendida)
                        if (prodReal.getCategoria() != null && prodReal.getCategoria().toLowerCase().contains("pack")) {
                            Integer stockActual = prodReal.getStock() != null ? prodReal.getStock() : 0;
                            prodReal.setStock(stockActual - dv.getCantidad());
                            productoRepository.save(prodReal);
                        } else {
                            // Para recetas, usamos el inventarioService que delega el inventario al RECETA repository 
                            inventarioService.procesarVenta(prodReal.getId(), dv.getCantidad(), "Venta POS: " + v.getOrigen());
                        }
                    }
                }
                
                ventaRepository.save(v);
                return ResponseEntity.ok("Venta cobrada e inventario local actualizado.");
            } else { 
                return ResponseEntity.badRequest().body("Venta ya pagada."); 
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Venta no encontrada");
    }

    @DeleteMapping("/{id}")
    public void eliminarVenta(@PathVariable Long id) { ventaRepository.deleteById(id); }
}