package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Gasto;
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
        
        double totalIngresos = ventaRepository.sumTotalBySucursalActiva(sucursal);
        double ingresosEfectivo = ventaRepository.sumTotalEfectivoBySucursalActiva(sucursal);
        double ingresosBanco = ventaRepository.sumTotalBancoBySucursalActiva(sucursal);
        double totalGastos = gastoRepository.sumGastosActivosBySucursal(sucursal);
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
        ventaRepository.archivarVentasPorSucursal(sucursal);
        gastoRepository.archivarGastosPorSucursal(sucursal);
        return ResponseEntity.ok("Cierre de caja exitoso. Contadores a $0.00.");
    }
}
