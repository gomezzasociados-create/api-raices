package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // 1. OBTENER TODOS (Para el Admin Supremo que ve todo el imperio)
    @GetMapping
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    // 2. NUEVO FILTRO INTELIGENTE: Obtener solo los de una sucursal (Para el POS)
    @GetMapping("/sucursal/{nombreSucursal}")
    public List<Producto> listarPorSucursal(@PathVariable String nombreSucursal) {
        return productoRepository.findBySucursal(nombreSucursal);
    }

    // 3. CREAR O ACTUALIZAR PRODUCTO (Ahora guardará la etiqueta de la sucursal)
    @PostMapping
    public Producto guardar(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    // 4. ELIMINAR PRODUCTO
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        productoRepository.deleteById(id);
    }
}