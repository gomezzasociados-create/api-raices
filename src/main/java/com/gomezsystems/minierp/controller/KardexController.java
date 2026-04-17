package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.MovimientoKardex;
import com.gomezsystems.minierp.repository.KardexRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kardex")
@CrossOrigin(origins = "*")
public class KardexController {

    @Autowired
    private KardexRepository kardexRepository;

    @GetMapping("/sucursal/{sucursal}")
    public List<MovimientoKardex> obtenerPorSucursal(@PathVariable String sucursal) {
        return kardexRepository.findBySucursalOrderByFechaHoraDesc(sucursal);
    }
}
