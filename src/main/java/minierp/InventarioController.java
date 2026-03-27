package com.gomezsystems.minierp.controller; // <-- 1. PAQUETE CORREGIDO

import com.gomezsystems.minierp.model.Insumo; // <-- 2. ¡IMPORTACIÓN MÁGICA AGREGADA!
import com.gomezsystems.minierp.service.InventarioService;
import com.gomezsystems.minierp.repository.InsumoRepository;
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
}