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
        
        if (payload.containsKey("pais") && payload.get("pais") != null && !payload.get("pais").toString().trim().isEmpty()) {
            v.setPais(payload.get("pais").toString());
        } else {
            v.setPais("Antofagasta");
        }

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
                Long pId = null;
                if (itemReq.get("id") != null) {
                    try {
                        pId = Long.parseLong(itemReq.get("id").toString());
                    } catch (Exception e) {
                        pId = null;
                    }
                }
                double pPrecio = 0.0;
                if (itemReq.get("precio") != null) {
                    try { pPrecio = Double.parseDouble(itemReq.get("precio").toString()); } catch (Exception e) {}
                }

                Producto prodReal = null;
                if (pId != null) {
                    Optional<Producto> prodOpt = productoRepository.findById(pId);
                    if (prodOpt.isPresent()) {
                        prodReal = prodOpt.get();
                    }
                }

                // Si es un batido personalizado de "Arma tu Batido" sin ID existente o con receta personalizada
                if (prodReal == null) {
                    prodReal = new Producto();
                    String nombreBatido = itemReq.get("nombre") != null ? itemReq.get("nombre").toString() : "Batido Personalizado";
                    prodReal.setNombre(nombreBatido);
                    prodReal.setCategoria("Arma tu Batido");
                    prodReal.setPrecio(pPrecio);
                    prodReal.setSucursal(v.getPais());
                    if (itemReq.get("recetaDetalle") != null) {
                        prodReal.setRecetaDetalle(itemReq.get("recetaDetalle").toString());
                    }
                    prodReal.setStock(0);
                    prodReal = productoRepository.save(prodReal);
                }

                Long realId = prodReal.getId();
                if (detailsMap.containsKey(realId)) {
                    DetalleVenta det = detailsMap.get(realId);
                    det.setCantidad(det.getCantidad() + 1);
                    det.setSubtotal(det.getCantidad() * pPrecio);
                } else {
                    DetalleVenta det = new DetalleVenta();
                    det.setProducto(prodReal);
                    det.setCantidad(1);
                    det.setSubtotal(pPrecio);
                    detailsMap.put(realId, det);
                }
                sumTotal += pPrecio;
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