package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Gasto;
import com.gomezsystems.minierp.model.Venta;
import com.gomezsystems.minierp.repository.GastoRepository;
import com.gomezsystems.minierp.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finanzas")
@CrossOrigin(origins = "*")
public class FinanzasController {

    @Autowired private VentaRepository ventaRepository;
    @Autowired private GastoRepository gastoRepository;

    @GetMapping("/indicadores/{sucursal}")
    public Map<String, Object> obetenerIndicadores(@PathVariable String sucursal) {
        List<Venta> ventas = ventaRepository.findAll();
        List<Gasto> gastos = gastoRepository.findBySucursal(sucursal);

        double totalIngresos = 0;
        double ingresosEfectivo = 0;
        double ingresosBanco = 0; // Tarjeta, Nequi, Transferencia...
        
        // Ventas no archivadas de la sucursal
        for (Venta v : ventas) {
            if (!v.isArchivada() && sucursal.equalsIgnoreCase(v.getPais())) {
                double t = v.getTotal() != null ? v.getTotal() : 0;
                totalIngresos += t;
                if ("Efectivo".equalsIgnoreCase(v.getMedioPago())) {
                    ingresosEfectivo += t;
                } else {
                    ingresosBanco += t;
                }
            }
        }

        double totalGastos = 0;
        for (Gasto g : gastos) {
            if (!g.isArchivada()) {
                totalGastos += (g.getMonto() != null ? g.getMonto() : 0);
            }
        }

        double utilidad = totalIngresos - totalGastos;

        Map<String, Object> resp = new HashMap<>();
        resp.put("ingresosNetos", totalIngresos);
        resp.put("ingresosEfectivo", ingresosEfectivo);
        resp.put("ingresosBanco", ingresosBanco);
        resp.put("gastos", totalGastos);
        resp.put("utilidad", utilidad);
        
        return resp;
    }

    @GetMapping("/gastos/{sucursal}")
    public List<Gasto> listarGastosActivos(@PathVariable String sucursal) {
        return gastoRepository.findBySucursal(sucursal).stream().filter(g -> !g.isArchivada()).toList();
    }

    @GetMapping("/gastos/todos/{sucursal}")
    public List<Gasto> listarTodosLosGastos(@PathVariable String sucursal) {
        return gastoRepository.findBySucursal(sucursal);
    }

    @PostMapping("/gastos")
    public Gasto agregarGasto(@RequestBody Gasto gasto) {
        gasto.setFecha(LocalDateTime.now(ZoneId.of("America/Santiago")));
        gasto.setArchivada(false);
        return gastoRepository.save(gasto);
    }

    @DeleteMapping("/gastos/{id}")
    public ResponseEntity<String> eliminarGasto(@PathVariable Long id) {
        gastoRepository.deleteById(id);
        return ResponseEntity.ok("Gasto eliminado.");
    }

    @PutMapping("/cierre/{sucursal}")
    public ResponseEntity<String> cerrarCajaDiaria(@PathVariable String sucursal) {
        // Archivamos Ventas
        List<Venta> ventas = ventaRepository.findAll();
        for (Venta v : ventas) {
            if (!v.isArchivada() && sucursal.equalsIgnoreCase(v.getPais())) {
                v.setArchivada(true);
                ventaRepository.save(v);
            }
        }

        // Archivamos Gastos
        List<Gasto> gastos = gastoRepository.findBySucursal(sucursal);
        for (Gasto g : gastos) {
            if (!g.isArchivada()) {
                g.setArchivada(true);
                gastoRepository.save(g);
            }
        }

        return ResponseEntity.ok("Cierre de caja exitoso. Contadores a $0.00.");
    }
}
