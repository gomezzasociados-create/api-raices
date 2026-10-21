package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.service.InventarioService;
import com.gomezsystems.minierp.service.WhatsAppNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*")
public class InventarioController {

    @Autowired
    private InventarioService inventarioService;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private WhatsAppNotificationService whatsAppNotificationService;

    // 1. Obtener todos los insumos para la tabla hermosa
    @GetMapping("/insumos")
    public List<Insumo> listarInsumos() {
        return insumoRepository.findAll();
    }

    // 2. Ejecutar la venta y el descuento de receta
    @PostMapping("/vender/{idProducto}")
    public String vender(@PathVariable Long idProducto, @RequestParam int cantidad) {
        inventarioService.procesarVenta(idProducto, cantidad);
        return "Venta procesada y stock actualizado";
    }

    // 3. Probar envío de alerta por WhatsApp al Administrador
    @PostMapping("/test-alerta-vasos")
    public String testAlertaVasos(@RequestParam(required = false) String telefono) {
        if (telefono != null && !telefono.isBlank()) {
            whatsAppNotificationService.setAdminWhatsappNumber(telefono.trim());
        }
        whatsAppNotificationService.enviarAlertaUmbralBajoVasos("Vaso Biodegradable 500cc (PRUEBA)", 8.0, "und", "Antofagasta");
        return "Alerta de prueba enviada hacia: " + whatsAppNotificationService.getAdminWhatsappNumber();
    }
}
