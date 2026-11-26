package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Gasto;
import com.gomezsystems.minierp.model.Venta;
import com.gomezsystems.minierp.repository.GastoRepository;
import com.gomezsystems.minierp.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;

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
        gasto.setTipoGasto(normalizarTipoGasto(gasto.getTipoGasto()));
        return gastoRepository.save(gasto);
    }

    @PutMapping("/gastos/{id}")
    public ResponseEntity<?> editarGasto(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String pin = body.get("pin") != null ? body.get("pin").toString().trim() : "";
        if (!esPinAutorizado(pin)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Clave de autorización incorrecta.");
        }
        Optional<Gasto> opt = gastoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gasto no encontrado.");

        Gasto g = opt.get();
        if (body.get("concepto") != null && !body.get("concepto").toString().trim().isEmpty()) {
            g.setConcepto(body.get("concepto").toString().trim());
        }
        if (body.get("monto") != null) {
            double monto = Double.parseDouble(body.get("monto").toString());
            if (monto < 0) return ResponseEntity.badRequest().body("El monto no puede ser negativo.");
            g.setMonto(monto);
        }
        if (body.get("tipoGasto") != null) {
            g.setTipoGasto(normalizarTipoGasto(body.get("tipoGasto").toString()));
        }
        return ResponseEntity.ok(gastoRepository.save(g));
    }

    @DeleteMapping("/gastos/{id}")
    public ResponseEntity<String> eliminarGasto(@PathVariable Long id, @RequestParam(required = false) String pin) {
        if (!esPinAutorizado(pin)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Clave de autorización incorrecta para eliminar gasto.");
        }
        if (!gastoRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gasto no encontrado.");
        }
        gastoRepository.deleteById(id);
        return ResponseEntity.ok("Gasto eliminado correctamente.");
    }

    @PutMapping("/ingresos/{id}")
    public ResponseEntity<?> editarIngreso(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String pin = body.get("pin") != null ? body.get("pin").toString().trim() : "";
        if (!esPinAutorizado(pin)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Clave de autorización incorrecta.");
        }
        Optional<Venta> opt = ventaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ingreso/Venta no encontrado.");

        Venta v = opt.get();
        if (body.get("total") != null) {
            double total = Double.parseDouble(body.get("total").toString());
            if (total < 0) return ResponseEntity.badRequest().body("El monto no puede ser negativo.");
            v.setTotal(total);
        }
        if (body.get("medioPago") != null && !body.get("medioPago").toString().trim().isEmpty()) {
            v.setMedioPago(body.get("medioPago").toString().trim());
        }
        if (body.get("origen") != null && !body.get("origen").toString().trim().isEmpty()) {
            v.setOrigen(body.get("origen").toString().trim());
        }
        if (body.get("nombreCliente") != null) {
            v.setNombreCliente(body.get("nombreCliente").toString().trim());
        }
        return ResponseEntity.ok(ventaRepository.save(v));
    }

    @DeleteMapping("/ingresos/{id}")
    public ResponseEntity<String> eliminarIngreso(@PathVariable Long id, @RequestParam(required = false) String pin) {
        if (!esPinAutorizado(pin)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Clave de autorización incorrecta para eliminar ingreso.");
        }
        if (!ventaRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ingreso/Venta no encontrado.");
        }
        ventaRepository.deleteById(id);
        return ResponseEntity.ok("Ingreso eliminado correctamente.");
    }

    @GetMapping("/ebitda/{sucursal}")
    public Map<String, Object> obtenerEbitda(
            @PathVariable String sucursal,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false, defaultValue = "true") boolean incluirArchivados) {

        LocalDate fechaDesde = (desde != null && !desde.isBlank()) ? LocalDate.parse(desde.trim()) : null;
        LocalDate fechaHasta = (hasta != null && !hasta.isBlank()) ? LocalDate.parse(hasta.trim()) : null;

        List<Venta> ventas = ventaRepository.findAll().stream()
                .filter(v -> v.getPais() != null && v.getPais().equalsIgnoreCase(sucursal))
                .filter(v -> "Pagado".equalsIgnoreCase(v.getEstado()))
                .filter(v -> incluirArchivados || !v.isArchivada())
                .filter(v -> dentroDeRango(v.getFecha(), fechaDesde, fechaHasta))
                .sorted(Comparator.comparing(Venta::getFecha, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<Gasto> gastos = gastoRepository.findBySucursal(sucursal).stream()
                .filter(g -> incluirArchivados || !g.isArchivada())
                .filter(g -> dentroDeRango(g.getFecha(), fechaDesde, fechaHasta))
                .sorted(Comparator.comparing(Gasto::getFecha, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        double ingresosTotales = 0;
        double ingresosEfectivo = 0;
        double ingresosBanco = 0;
        Map<YearMonth, double[]> mensual = new TreeMap<>(Comparator.reverseOrder()); // [ingresos, opex, capex]

        for (Venta v : ventas) {
            double monto = v.getTotal() != null ? v.getTotal() : 0.0;
            ingresosTotales += monto;
            String mp = v.getMedioPago() != null ? v.getMedioPago().toLowerCase() : "";
            if (mp.contains("efectivo")) ingresosEfectivo += monto;
            else ingresosBanco += monto;

            YearMonth ym = v.getFecha() != null ? YearMonth.from(v.getFecha()) : YearMonth.now();
            mensual.computeIfAbsent(ym, k -> new double[3])[0] += monto;
        }

        double opexTotal = 0;
        double capexTotal = 0;
        int countOpex = 0;
        int countCapex = 0;

        List<Map<String, Object>> gastosDto = new ArrayList<>();
        for (Gasto g : gastos) {
            double monto = g.getMonto() != null ? g.getMonto() : 0.0;
            String tipo = normalizarTipoGasto(g.getTipoGasto());
            YearMonth ym = g.getFecha() != null ? YearMonth.from(g.getFecha()) : YearMonth.now();
            if ("CAPEX".equals(tipo)) {
                capexTotal += monto;
                countCapex++;
                mensual.computeIfAbsent(ym, k -> new double[3])[2] += monto;
            } else {
                opexTotal += monto;
                countOpex++;
                mensual.computeIfAbsent(ym, k -> new double[3])[1] += monto;
            }
            Map<String, Object> gd = new LinkedHashMap<>();
            gd.put("id", g.getId());
            gd.put("concepto", g.getConcepto());
            gd.put("monto", monto);
            gd.put("tipoGasto", tipo);
            gd.put("fecha", g.getFecha());
            gd.put("archivada", g.isArchivada());
            gastosDto.add(gd);
        }

        List<Map<String, Object>> ventasDto = new ArrayList<>();
        for (Venta v : ventas) {
            Map<String, Object> vd = new LinkedHashMap<>();
            vd.put("id", v.getId());
            vd.put("origen", v.getOrigen());
            vd.put("medioPago", v.getMedioPago());
            vd.put("nombreCliente", v.getNombreCliente());
            vd.put("total", v.getTotal() != null ? v.getTotal() : 0.0);
            vd.put("fecha", v.getFecha());
            vd.put("archivada", v.isArchivada());
            ventasDto.add(vd);
        }

        List<Map<String, Object>> historialMensual = new ArrayList<>();
        for (Map.Entry<YearMonth, double[]> entry : mensual.entrySet()) {
            double ing = entry.getValue()[0];
            double opex = entry.getValue()[1];
            double capex = entry.getValue()[2];
            double ebitdaMes = ing - opex;
            double margenMes = ing > 0 ? (ebitdaMes / ing) * 100.0 : 0.0;
            Map<String, Object> hm = new LinkedHashMap<>();
            hm.put("periodo", entry.getKey().toString());
            hm.put("ingresos", Math.round(ing));
            hm.put("opex", Math.round(opex));
            hm.put("ebitda", Math.round(ebitdaMes));
            hm.put("margenPct", Math.round(margenMes * 10.0) / 10.0);
            hm.put("capex", Math.round(capex));
            hm.put("flujoNeto", Math.round(ebitdaMes - capex));
            historialMensual.add(hm);
        }

        double ebitda = ingresosTotales - opexTotal;
        double margenEbitda = ingresosTotales > 0 ? (ebitda / ingresosTotales) * 100.0 : 0.0;
        double flujoCajaNeto = ebitda - capexTotal;

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("sucursal", sucursal);
        resp.put("ingresosTotales", Math.round(ingresosTotales));
        resp.put("ingresosEfectivo", Math.round(ingresosEfectivo));
        resp.put("ingresosBanco", Math.round(ingresosBanco));
        resp.put("opexTotal", Math.round(opexTotal));
        resp.put("capexTotal", Math.round(capexTotal));
        resp.put("ebitda", Math.round(ebitda));
        resp.put("margenEbitda", Math.round(margenEbitda * 10.0) / 10.0);
        resp.put("flujoCajaNeto", Math.round(flujoCajaNeto));
        resp.put("cantidadVentas", ventas.size());
        resp.put("cantidadOpex", countOpex);
        resp.put("cantidadCapex", countCapex);
        resp.put("historialMensual", historialMensual);
        resp.put("ventas", ventasDto);
        resp.put("gastos", gastosDto);
        return resp;
    }

    private boolean dentroDeRango(LocalDateTime dt, LocalDate desde, LocalDate hasta) {
        if (dt == null) return desde == null && hasta == null;
        LocalDate d = dt.toLocalDate();
        if (desde != null && d.isBefore(desde)) return false;
        if (hasta != null && d.isAfter(hasta)) return false;
        return true;
    }

    private String normalizarTipoGasto(String raw) {
        if (raw == null) return "OPEX";
        String u = raw.trim().toUpperCase();
        if (u.contains("CAPEX")) return "CAPEX";
        return "OPEX";
    }

    private boolean esPinAutorizado(String pin) {
        return pin != null && ("7777".equals(pin.trim()) || "1234".equals(pin.trim()));
    }

    @PutMapping("/cierre/{sucursal}")
    public ResponseEntity<String> cerrarCajaDiaria(@PathVariable String sucursal) {
        ventaRepository.archivarVentasPorSucursal(sucursal);
        gastoRepository.archivarGastosPorSucursal(sucursal);
        return ResponseEntity.ok("Cierre de caja exitoso. Contadores a $0.00.");
    }
}
