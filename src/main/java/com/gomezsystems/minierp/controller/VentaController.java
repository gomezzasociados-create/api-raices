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

import com.gomezsystems.minierp.service.WhatsAppNotificationService;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
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
    @Autowired(required = false) private WhatsAppNotificationService whatsAppNotificationService;

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

                // Si es un batido personalizado de "Arma tu Batido" sin ID numérico existente en catálogo o con receta personalizada
                if (prodReal == null) {
                    prodReal = new Producto();
                    String nombreBatido = itemReq.get("nombre") != null ? itemReq.get("nombre").toString() : "Batido Personalizado 500cc";
                    prodReal.setNombre(nombreBatido);
                    prodReal.setCategoria("Personalizado"); // Categoría interna para Tesorería (no se guarda en el catálogo)
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
        // IMPORTANTE: Se guarda en estado 'Pendiente'. NO se descuenta inventario hasta la confirmación de la venta.
        Venta ventaGuardada = ventaRepository.save(v);

        // Notificación inmediata al Administrador vía WhatsApp al realizarse la compra
        if (whatsAppNotificationService != null) {
            try {
                String clienteNombre = ventaGuardada.getNombreCliente() != null && !ventaGuardada.getNombreCliente().isBlank()
                        ? ventaGuardada.getNombreCliente() : "Cliente General";
                String clienteTelefono = "No registrado";
                String clienteDireccion = "No registrada";

                if (payload.containsKey("cliente") && payload.get("cliente") instanceof Map) {
                    Map<?, ?> cMap = (Map<?, ?>) payload.get("cliente");
                    if (cMap.get("telefono") != null && !cMap.get("telefono").toString().isBlank()) {
                        clienteTelefono = cMap.get("telefono").toString().trim();
                    }
                    if (cMap.get("direccion") != null && !cMap.get("direccion").toString().isBlank()) {
                        clienteDireccion = cMap.get("direccion").toString().trim();
                    }
                }

                List<String> itemsResumen = new ArrayList<>();
                if (ventaGuardada.getDetalles() != null) {
                    for (DetalleVenta dv : ventaGuardada.getDetalles()) {
                        String prodNom = (dv.getProducto() != null && dv.getProducto().getNombre() != null)
                                ? dv.getProducto().getNombre() : "Producto";
                        int cant = dv.getCantidad() != null ? dv.getCantidad() : 1;
                        double sub = dv.getSubtotal() != null ? dv.getSubtotal() : 0.0;
                        itemsResumen.add(String.format("• %dx %s ($%,.0f)", cant, prodNom, sub));
                    }
                }

                whatsAppNotificationService.enviarNotificacionNuevaVenta(
                    ventaGuardada.getId(),
                    clienteNombre,
                    clienteTelefono,
                    clienteDireccion,
                    ventaGuardada.getPais(),
                    ventaGuardada.getOrigen(),
                    ventaGuardada.getMedioPago(),
                    ventaGuardada.getTotal(),
                    ventaGuardada.getEstado(),
                    itemsResumen
                );
            } catch (Exception eNotif) {
                System.err.println("⚠️ Error al disparar notificación de venta por WhatsApp: " + eNotif.getMessage());
            }
        }

        return ventaGuardada;
    }

    @PutMapping("/{id}/pagar")
    @Transactional
    public ResponseEntity<String> confirmarPago(@PathVariable Long id) {
        Optional<Venta> ventaOpt = ventaRepository.findById(id);
        if (ventaOpt.isPresent()) {
            Venta v = ventaOpt.get();
            if (!"Pagado".equalsIgnoreCase(v.getEstado())) {
                v.setEstado("Pagado");
                
                // REGLA SAGRADA: Solo al confirmar la venta se descuentan las porciones de Arma tu Batido y los vasos
                if (v.getDetalles() != null) {
                    for (DetalleVenta dv : v.getDetalles()) {
                        Producto prodReal = dv.getProducto();
                        if (prodReal == null) continue;
                        
                        // Si es un pack, se reduce el stock base (1 * cantidad vendida)
                        if (prodReal.getCategoria() != null && prodReal.getCategoria().toLowerCase().contains("pack")) {
                            Integer stockActual = prodReal.getStock() != null ? prodReal.getStock() : 0;
                            prodReal.setStock(stockActual - dv.getCantidad());
                            productoRepository.save(prodReal);
                        } else {
                            // Para batidos y productos con receta:
                            // InventarioService descuenta porciones de Bodega Arma tu Batido y vasos de Bodega Vasos
                            inventarioService.procesarVenta(prodReal.getId(), dv.getCantidad(), "Venta Confirmada #" + v.getId() + " (" + v.getOrigen() + ")");
                        }
                    }
                }
                
                ventaRepository.save(v);

                // Notificación al Administrador sobre pago confirmado e inventario descontado
                if (whatsAppNotificationService != null) {
                    try {
                        whatsAppNotificationService.enviarNotificacionPagoConfirmado(
                            v.getId(),
                            v.getNombreCliente(),
                            v.getPais(),
                            v.getMedioPago(),
                            v.getTotal()
                        );
                    } catch (Exception eNotif) {
                        System.err.println("⚠️ Error al notificar pago confirmado por WhatsApp: " + eNotif.getMessage());
                    }
                }

                return ResponseEntity.ok("Venta confirmada exitosamente. Se descontaron los insumos correspondientes de las bodegas.");
            } else { 
                return ResponseEntity.badRequest().body("Venta ya confirmada y pagada previamente."); 
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Venta no encontrada");
    }

    @PutMapping("/{id}/cancelar")
    @Transactional
    public ResponseEntity<String> cancelarVenta(@PathVariable Long id) {
        Optional<Venta> ventaOpt = ventaRepository.findById(id);
        if (ventaOpt.isPresent()) {
            Venta v = ventaOpt.get();
            if ("Pagado".equalsIgnoreCase(v.getEstado())) {
                return ResponseEntity.badRequest().body("No se puede cancelar una venta que ya fue pagada y descontada de inventario.");
            }
            v.setEstado("Cancelado");
            v.setArchivada(true);
            ventaRepository.save(v);
            return ResponseEntity.ok("Pedido cancelado exitosamente. No se descontó inventario de las bodegas.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Venta no encontrada");
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<String> eliminarVenta(@PathVariable Long id) {
        Optional<Venta> ventaOpt = ventaRepository.findById(id);
        if (ventaOpt.isPresent()) {
            ventaRepository.deleteById(id);
            return ResponseEntity.ok("Venta eliminada del sistema.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Venta no encontrada");
    }
}
